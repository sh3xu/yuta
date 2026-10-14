use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Listener, Manager,
};

mod activity;
mod click_through;
mod pointer;
#[cfg(windows)]
mod loopback;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CursorPoint {
    x: i32,
    y: i32,
    screen_x: i32,
    screen_y: i32,
    screen_w: i32,
    screen_h: i32,
}

fn cursor_point() -> CursorPoint {
    #[cfg(windows)]
    {
        #[repr(C)]
        struct Point {
            x: i32,
            y: i32,
        }
        const SM_XVIRTUALSCREEN: i32 = 76;
        const SM_YVIRTUALSCREEN: i32 = 77;
        const SM_CXVIRTUALSCREEN: i32 = 78;
        const SM_CYVIRTUALSCREEN: i32 = 79;
        extern "system" {
            fn GetCursorPos(point: *mut Point) -> i32;
            fn GetSystemMetrics(index: i32) -> i32;
        }
        let mut point = Point { x: 0, y: 0 };
        unsafe {
            GetCursorPos(&mut point);
            CursorPoint {
                x: point.x,
                y: point.y,
                screen_x: GetSystemMetrics(SM_XVIRTUALSCREEN),
                screen_y: GetSystemMetrics(SM_YVIRTUALSCREEN),
                screen_w: GetSystemMetrics(SM_CXVIRTUALSCREEN).max(1),
                screen_h: GetSystemMetrics(SM_CYVIRTUALSCREEN).max(1),
            }
        }
    }
    #[cfg(not(windows))]
    {
        CursorPoint {
            x: 0,
            y: 0,
            screen_x: 0,
            screen_y: 0,
            screen_w: 1,
            screen_h: 1,
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_millis(40));
                let point = cursor_point();
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.emit("cursor-move", point);
                }
            });

            pointer::start(app.handle().clone());
            click_through::install(app.handle().clone());
            app.listen("set-click-through", |event| {
                #[derive(serde::Deserialize)]
                struct Payload {
                    ignore: bool,
                }
                if let Ok(payload) = serde_json::from_str::<Payload>(event.payload()) {
                    click_through::request(payload.ignore);
                }
            });

            let activity = app.handle().clone();
            std::thread::spawn(move || activity::run(activity));

            #[cfg(windows)]
            {
                let audio = app.handle().clone();
                std::thread::spawn(move || loopback::run(audio));
            }

            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&show, &hide, &sep, &settings, &sep2, &quit])?;

            let mut tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .tooltip("Yuta")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("settings") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                });

            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }

            tray.build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
