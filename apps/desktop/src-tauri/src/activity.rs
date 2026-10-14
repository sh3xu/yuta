use std::thread;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

const EVENT: &str = "desktop-activity";
const POLL: Duration = Duration::from_millis(500);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopActivity {
    idle_ms: u64,
    music_playing: bool,
}

pub fn run(app: AppHandle) {
    #[cfg(windows)]
    {
        ensure_apartment();
    }

    loop {
        let activity = DesktopActivity {
            idle_ms: idle_ms(),
            music_playing: music_playing(),
        };
        let _ = app.emit(EVENT, activity);
        thread::sleep(POLL);
    }
}

fn idle_ms() -> u64 {
    #[cfg(windows)]
    {
        #[repr(C)]
        struct LastInputInfo {
            cb_size: u32,
            dw_time: u32,
        }
        extern "system" {
            fn GetLastInputInfo(info: *mut LastInputInfo) -> i32;
            fn GetTickCount() -> u32;
        }
        let mut info = LastInputInfo {
            cb_size: std::mem::size_of::<LastInputInfo>() as u32,
            dw_time: 0,
        };
        unsafe {
            if GetLastInputInfo(&mut info) == 0 {
                return 0;
            }
            return u64::from(GetTickCount().wrapping_sub(info.dw_time));
        }
    }
    #[cfg(not(windows))]
    {
        0
    }
}

fn music_playing() -> bool {
    #[cfg(windows)]
    {
        return media_playing();
    }
    #[cfg(not(windows))]
    {
        false
    }
}

#[cfg(windows)]
fn ensure_apartment() {
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_MULTITHREADED};
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
    }
}

#[cfg(windows)]
fn media_playing() -> bool {
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };

    let operation = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
        Ok(operation) => operation,
        Err(_) => return false,
    };
    let manager = match operation.join() {
        Ok(manager) => manager,
        Err(_) => return false,
    };
    let sessions = match manager.GetSessions() {
        Ok(sessions) => sessions,
        Err(_) => return false,
    };
    for session in &sessions {
        let Ok(info) = session.GetPlaybackInfo() else {
            continue;
        };
        let Ok(status) = info.PlaybackStatus() else {
            continue;
        };
        if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
            return true;
        }
    }
    false
}
