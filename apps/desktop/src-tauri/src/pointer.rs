use std::sync::atomic::{AtomicBool, AtomicI32};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

const EVENT: &str = "pointer-gesture";
const DRAG_PX: i32 = 16;

static APP: Mutex<Option<AppHandle>> = Mutex::new(None);
static LEFT_DOWN: AtomicBool = AtomicBool::new(false);
static LEFT_X: AtomicI32 = AtomicI32::new(0);
static LEFT_Y: AtomicI32 = AtomicI32::new(0);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PointerGesture {
    kind: &'static str,
    delta: i32,
    x: i32,
    y: i32,
}

pub fn start(app: AppHandle) {
    if let Ok(mut slot) = APP.lock() {
        *slot = Some(app);
    }
    #[cfg(windows)]
    std::thread::spawn(windows::run);
}

fn emit(gesture: PointerGesture) {
    let Ok(slot) = APP.lock() else {
        return;
    };
    let Some(app) = slot.as_ref() else {
        return;
    };
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit(EVENT, gesture);
    }
}

#[cfg(windows)]
mod windows {
    use super::{emit, PointerGesture, DRAG_PX, LEFT_DOWN, LEFT_X, LEFT_Y};
    use std::sync::atomic::Ordering;

    const WH_MOUSE_LL: i32 = 14;
    const WM_LBUTTONDOWN: usize = 0x0201;
    const WM_LBUTTONUP: usize = 0x0202;
    const WM_RBUTTONDOWN: usize = 0x0204;
    const WM_MOUSEWHEEL: usize = 0x020A;

    #[repr(C)]
    struct Point {
        x: i32,
        y: i32,
    }

    #[repr(C)]
    struct MouseHook {
        point: Point,
        mouse_data: u32,
        flags: u32,
        time: u32,
        extra: usize,
    }

    #[repr(C)]
    struct Msg {
        hwnd: isize,
        message: u32,
        wparam: usize,
        lparam: isize,
        time: u32,
        x: i32,
        y: i32,
    }

    type HookProc = unsafe extern "system" fn(i32, usize, isize) -> isize;

    extern "system" {
        fn SetWindowsHookExW(id: i32, proc: Option<HookProc>, module: *mut core::ffi::c_void, thread: u32) -> isize;
        fn CallNextHookEx(hook: isize, code: i32, wparam: usize, lparam: isize) -> isize;
        fn GetMessageW(msg: *mut Msg, hwnd: isize, min: u32, max: u32) -> i32;
        fn TranslateMessage(msg: *const Msg) -> i32;
        fn DispatchMessageW(msg: *const Msg) -> isize;
    }

    pub fn run() {
        unsafe {
            let hook = SetWindowsHookExW(WH_MOUSE_LL, Some(proc), core::ptr::null_mut(), 0);
            if hook == 0 {
                return;
            }
            let mut msg = Msg {
                hwnd: 0,
                message: 0,
                wparam: 0,
                lparam: 0,
                time: 0,
                x: 0,
                y: 0,
            };
            while GetMessageW(&mut msg, 0, 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
            let _ = hook;
        }
    }

    unsafe extern "system" fn proc(code: i32, wparam: usize, lparam: isize) -> isize {
        if code >= 0 && lparam != 0 {
            let info = &*(lparam as *const MouseHook);
            match wparam {
                WM_LBUTTONDOWN => {
                    LEFT_DOWN.store(true, Ordering::Relaxed);
                    LEFT_X.store(info.point.x, Ordering::Relaxed);
                    LEFT_Y.store(info.point.y, Ordering::Relaxed);
                }
                WM_LBUTTONUP => {
                    let down = LEFT_DOWN.swap(false, Ordering::Relaxed);
                    let dx = info.point.x - LEFT_X.load(Ordering::Relaxed);
                    let dy = info.point.y - LEFT_Y.load(Ordering::Relaxed);
                    if down && dx * dx + dy * dy <= DRAG_PX * DRAG_PX {
                        emit(PointerGesture {
                            kind: "left",
                            delta: 0,
                            x: info.point.x,
                            y: info.point.y,
                        });
                    }
                }
                WM_RBUTTONDOWN => emit(PointerGesture {
                    kind: "right",
                    delta: 0,
                    x: info.point.x,
                    y: info.point.y,
                }),
                WM_MOUSEWHEEL => {
                    let delta = ((info.mouse_data >> 16) as i16) as i32;
                    if delta != 0 {
                        emit(PointerGesture {
                            kind: "wheel",
                            delta,
                            x: info.point.x,
                            y: info.point.y,
                        });
                    }
                }
                _ => {}
            }
        }
        CallNextHookEx(0, code, wparam, lparam)
    }
}
