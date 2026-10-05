// Oculta la consola en Windows en builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// La app solo abre el sistema publicado en producción (ver tauri.conf.json)
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error al iniciar AYP Sistema");
}
