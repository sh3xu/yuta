use std::sync::atomic::{AtomicBool, AtomicIsize, AtomicU8, Ordering};
use std::time::Duration;

use tauri::{AppHandle, Manager};

static ENABLED: AtomicBool = AtomicBool::new(true);
static APPLIED: AtomicU8 = AtomicU8::new(255);
static MAIN_HWND: AtomicIsize = AtomicIsize::new(0);

const UNKNOWN: u8 = 255;

pub fn install(app: AppHandle) {
    std::thread::spawn(move || {
        let mut tick = 0u32;
        loop {
            std::thread::sleep(Duration::from_millis(32));
            let want = ENABLED.load(Ordering::SeqCst);
            if APPLIED.load(Ordering::SeqCst) != u8::from(want) {
                apply(&app, want);
            } else if want {
                tick = tick.wrapping_add(1);
                if tick % 6 == 0 {
                    harden(&app, true);
                    release_focus();
                }
            }
        }
    });
}

pub fn request(ignore: bool) {
    ENABLED.store(ignore, Ordering::SeqCst);
}

pub fn swallow_wheel(x: i32, y: i32, delta: i32) -> bool {
    #[cfg(windows)]
    {
        return windows::swallow_wheel(x, y, delta);
    }
    #[cfg(not(windows))]
    {
        let _ = (x, y, delta);
        false
    }
}

fn apply(app: &AppHandle, ignore: bool) {
    APPLIED.store(u8::from(ignore), Ordering::SeqCst);
    let Some(window) = app.get_webview_window("main") else {
        APPLIED.store(UNKNOWN, Ordering::SeqCst);
        return;
    };
    if window.set_ignore_cursor_events(ignore).is_err() || window.set_focusable(!ignore).is_err() {
        APPLIED.store(UNKNOWN, Ordering::SeqCst);
    }
    harden(app, ignore);
    if ignore {
        release_focus();
    }
}

fn harden(app: &AppHandle, ignore: bool) {
    #[cfg(windows)]
    {
        windows::harden(app, ignore);
    }
    #[cfg(not(windows))]
    {
        let _ = (app, ignore);
    }
}

fn release_focus() {
    #[cfg(windows)]
    windows::release_focus();
}

#[cfg(windows)]
mod windows {
    use super::{ENABLED, MAIN_HWND};
    use std::collections::HashSet;
    use std::sync::atomic::Ordering;
    use std::sync::Mutex;
    use tauri::{AppHandle, Manager};
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
    use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
    use windows::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumChildWindows, GetCursorPos, GetForegroundWindow, GetWindow, GetWindowRect,
        GetWindowThreadProcessId, IsChild, IsWindow, IsWindowVisible, PostMessageW, SetForegroundWindow,
        WindowFromPoint, GW_HWNDNEXT, HTTRANSPARENT, WM_MOUSEWHEEL, WM_NCHITTEST,
    };

    const SUBCLASS_ID: usize = 0x5955_5441;

    static SUBCLASS: Mutex<Option<HashSet<isize>>> = Mutex::new(None);

    pub fn harden(app: &AppHandle, _ignore: bool) {
        let Some(raw) = main_raw(app) else {
            return;
        };
        let Some(window) = app.get_webview_window("main") else {
            return;
        };
        let _ = window.run_on_main_thread(move || unsafe {
            let root = hwnd(raw);
            patch(root, true);
            let _ = EnumChildWindows(Some(root), Some(on_child), LPARAM(0));
        });
    }

    pub fn release_focus() {
        let raw = MAIN_HWND.load(Ordering::SeqCst);
        if raw == 0 {
            return;
        }
        unsafe {
            let root = hwnd(raw);
            let foreground = GetForegroundWindow();
            if !related(root, foreground) {
                return;
            }
            let mut point = POINT::default();
            if GetCursorPos(&mut point).is_err() {
                return;
            }
            let target = window_under(point.x, point.y, root);
            if target.0.is_null() || related(root, target) {
                return;
            }
            focus(foreground, target);
        }
    }

    pub fn swallow_wheel(x: i32, y: i32, delta: i32) -> bool {
        if !ENABLED.load(Ordering::SeqCst) || delta == 0 {
            return false;
        }
        let raw = MAIN_HWND.load(Ordering::SeqCst);
        if raw == 0 {
            return false;
        }
        unsafe {
            let root = hwnd(raw);
            let foreground = GetForegroundWindow();
            if !related(root, foreground) {
                return false;
            }
            let target = window_under(x, y, root);
            if target.0.is_null() || related(root, target) {
                return false;
            }
            let packed = (delta as i16 as u16 as usize) << 16;
            let coords = (x as u16 as isize) | ((y as u16 as isize) << 16);
            let _ = PostMessageW(Some(target), WM_MOUSEWHEEL, WPARAM(packed), LPARAM(coords));
            true
        }
    }

    fn main_raw(app: &AppHandle) -> Option<isize> {
        let window = app.get_webview_window("main")?;
        let handle = window.hwnd().ok()?;
        let raw = handle.0 as isize;
        if raw != 0 {
            MAIN_HWND.store(raw, Ordering::SeqCst);
        }
        Some(raw)
    }

    fn hwnd(raw: isize) -> HWND {
        HWND(raw as *mut core::ffi::c_void)
    }

    unsafe extern "system" fn on_child(child: HWND, _param: LPARAM) -> windows::core::BOOL {
        patch(child, false);
        windows::core::BOOL(1)
    }

    unsafe extern "system" fn hit_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        _id: usize,
        _data: usize,
    ) -> LRESULT {
        // NOTE: WebView2 answers WM_NCHITTEST itself, so the parent transparent style never receives the click.
        if msg == WM_NCHITTEST && ENABLED.load(Ordering::SeqCst) {
            return LRESULT(HTTRANSPARENT as isize);
        }
        DefSubclassProc(hwnd, msg, wparam, lparam)
    }

    unsafe fn patch(hwnd: HWND, front: bool) {
        if hwnd.0.is_null() || !IsWindow(Some(hwnd)).as_bool() {
            return;
        }
        subclass(hwnd, front);
    }

    unsafe fn subclass(hwnd: HWND, front: bool) {
        let key = hwnd.0 as isize;
        let mut guard = SUBCLASS.lock().unwrap_or_else(|error| error.into_inner());
        let seen = guard.get_or_insert_with(HashSet::new);
        if seen.contains(&key) && !front {
            return;
        }
        if front {
            let _ = RemoveWindowSubclass(hwnd, Some(hit_proc), SUBCLASS_ID);
        }
        if SetWindowSubclass(hwnd, Some(hit_proc), SUBCLASS_ID, 0).as_bool() {
            seen.insert(key);
        }
    }

    unsafe fn related(root: HWND, hwnd: HWND) -> bool {
        !hwnd.0.is_null() && (hwnd == root || IsChild(root, hwnd).as_bool())
    }

    unsafe fn window_under(x: i32, y: i32, root: HWND) -> HWND {
        let hit = WindowFromPoint(POINT { x, y });
        if !hit.0.is_null() && !related(root, hit) {
            return hit;
        }
        let mut next = GetWindow(root, GW_HWNDNEXT).unwrap_or(HWND(std::ptr::null_mut()));
        let mut guard = 0;
        while !next.0.is_null() && guard < 48 {
            guard += 1;
            if IsWindowVisible(next).as_bool() && !related(root, next) && contains(next, x, y) {
                return next;
            }
            next = GetWindow(next, GW_HWNDNEXT).unwrap_or(HWND(std::ptr::null_mut()));
        }
        HWND(std::ptr::null_mut())
    }

    unsafe fn contains(hwnd: HWND, x: i32, y: i32) -> bool {
        let mut rect = RECT::default();
        GetWindowRect(hwnd, &mut rect).is_ok()
            && x >= rect.left
            && x < rect.right
            && y >= rect.top
            && y < rect.bottom
    }

    unsafe fn focus(from: HWND, to: HWND) {
        let current = GetCurrentThreadId();
        let from_thread = GetWindowThreadProcessId(from, None);
        let to_thread = GetWindowThreadProcessId(to, None);
        let attach_from = from_thread != 0 && from_thread != current;
        let attach_to = to_thread != 0 && to_thread != current && to_thread != from_thread;
        if attach_from {
            let _ = AttachThreadInput(current, from_thread, true);
        }
        if attach_to {
            let _ = AttachThreadInput(current, to_thread, true);
        }
        let _ = SetForegroundWindow(to);
        if attach_to {
            let _ = AttachThreadInput(current, to_thread, false);
        }
        if attach_from {
            let _ = AttachThreadInput(current, from_thread, false);
        }
    }
}
