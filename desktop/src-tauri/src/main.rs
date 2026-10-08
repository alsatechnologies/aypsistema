// Oculta la consola en Windows en builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::Manager;

// Nivel de zoom actual de la ventana (1.0 = 100%)
struct Zoom(Mutex<f64>);

const ZOOM_PASO: f64 = 0.1;
const ZOOM_MIN: f64 = 0.5;
const ZOOM_MAX: f64 = 2.0;

// Windows: se inyecta zoom.js, que escucha Ctrl + / Ctrl - / Ctrl 0 y Ctrl + rueda
// y cambia el zoom vía IPC (permiso en capabilities/zoom.json).
// Mac: menú "Zoom" con los atajos Cmd + / Cmd - / Cmd 0, que ajusta el zoom desde Rust.
#[cfg(target_os = "macos")]
fn menu_mac(app: &tauri::AppHandle) -> tauri::Result<tauri::menu::Menu<tauri::Wry>> {
    use tauri::menu::{Menu, MenuItem, Submenu};

    // Menú estándar de Mac (Edición con copiar/pegar, Ventana, etc.) + Zoom
    let menu = Menu::default(app)?;
    let acercar = MenuItem::with_id(app, "zoom_in", "Acercar", true, Some("CmdOrCtrl+="))?;
    let alejar = MenuItem::with_id(app, "zoom_out", "Alejar", true, Some("CmdOrCtrl+-"))?;
    let normal = MenuItem::with_id(app, "zoom_reset", "Tamaño normal", true, Some("CmdOrCtrl+0"))?;
    let zoom = Submenu::with_items(app, "Zoom", true, &[&acercar, &alejar, &normal])?;
    menu.append(&zoom)?;
    Ok(menu)
}

// La app solo abre el sistema publicado en producción (ver tauri.conf.json)
fn main() {
    tauri::Builder::default()
        .manage(Zoom(Mutex::new(1.0)))
        .setup(|_app| {
            // La ventana se crea aquí (create: false en tauri.conf.json) para poder inyectar zoom.js
            let config = _app.config().app.windows[0].clone();
            let ventana = tauri::WebviewWindowBuilder::from_config(_app.handle(), &config)?;
            #[cfg(target_os = "windows")]
            let ventana = ventana.initialization_script(include_str!("zoom.js"));
            ventana.build()?;

            #[cfg(target_os = "macos")]
            {
                let menu = menu_mac(_app.handle())?;
                _app.set_menu(menu)?;
            }
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if !id.starts_with("zoom_") {
                return;
            }
            let estado = app.state::<Zoom>();
            let mut nivel = estado.0.lock().unwrap();
            *nivel = match id {
                "zoom_in" => (*nivel + ZOOM_PASO).min(ZOOM_MAX),
                "zoom_out" => (*nivel - ZOOM_PASO).max(ZOOM_MIN),
                _ => 1.0,
            };
            if let Some(ventana) = app.get_webview_window("main") {
                let _ = ventana.set_zoom(*nivel);
            }
        })
        .run(tauri::generate_context!())
        .expect("error al iniciar AYP Sistema");
}
