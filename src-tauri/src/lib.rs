use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};

#[tauri::command]
fn set_unread_summary(
    app: AppHandle,
    messages: u32,
    notifications: u32,
) -> Result<(), String> {
    let total = messages + notifications;

    if let Some(window) = app.get_webview_window("main") {
        window
            .set_badge_count(if total > 0 {
                Some(total as i64)
            } else {
                None
            })
            .map_err(|e| e.to_string())?;
    }

    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = if total > 0 {
            format!("Lyntr — {total} unread")
        } else {
            "Lyntr".to_string()
        };

        tray.set_tooltip(Some(tooltip))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // IMPORTANT:
    // Single-instance must be registered first so that on Windows/Linux,
    // deep-link launches can be forwarded to the already-running instance.
    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_single_instance::init(|app, args, cwd| {
                println!(
                    "[Lyntr Desktop] Second instance launched: args={args:?}, cwd={cwd:?}"
                );

                show_main_window(app);
            }),
        );
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![set_unread_summary])
        .setup(|app| {
            let handle = app.handle().clone();

            // -------------------------
            // System tray
            // -------------------------

            let open_item = MenuItem::with_id(
                app,
                "open",
                "Open Lyntr",
                true,
                None::<&str>,
            )?;

            let messages_item = MenuItem::with_id(
                app,
                "messages",
                "Messages",
                true,
                None::<&str>,
            )?;

            let notifications_item = MenuItem::with_id(
                app,
                "notifications",
                "Notifications",
                true,
                None::<&str>,
            )?;

            let quit_item = MenuItem::with_id(
                app,
                "quit",
                "Quit Lyntr",
                true,
                None::<&str>,
            )?;

            let separator = PredefinedMenuItem::separator(app)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &open_item,
                    &messages_item,
                    &notifications_item,
                    &separator,
                    &quit_item,
                ],
            )?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Lyntr")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "open" => {
                            show_main_window(app);
                        }

                        "messages" => {
                            show_main_window(app);
                            let _ = app.emit("navigate", "messages");
                        }

                        "notifications" => {
                            show_main_window(app);
                            let _ = app.emit("navigate", "notifications");
                        }

                        "quit" => {
                            app.exit(0);
                        }

                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // -------------------------
            // Deep-link registration
            // -------------------------

            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                match handle.deep_link().register_all() {
                    Ok(_) => {
                        println!(
                            "[Lyntr Desktop] Deep-link protocols registered"
                        );
                    }

                    Err(error) => {
                        eprintln!(
                            "[Lyntr Desktop] Failed to register deep-link protocols: {error}"
                        );
                    }
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }

            if let WindowEvent::CloseRequested { api, .. } = event {
                // Close-to-tray only applies to the main Lyntr window.
                api.prevent_close();

                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Lyntr Desktop");
}