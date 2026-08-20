pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_files_cmd,
            commands::read_file_cmd,
            commands::write_file_cmd,
            commands::create_file_cmd,
            commands::rename_file_cmd,
            commands::delete_file_cmd,
            commands::create_dir_cmd,
            commands::zip_vault_cmd,
            commands::pick_folder,
            commands::pick_file,
            commands::save_file,
            commands::read_vault_config_cmd,
            commands::write_vault_config_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}