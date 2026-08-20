use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

#[derive(Clone, serde::Serialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<TreeNode>,
}

fn is_mdnotes(dir: &Path) -> bool {
    dir.file_name().map_or(false, |n| n == ".mdnotes")
}

pub fn list_files(root: String) -> String {
    let root = PathBuf::from(&root);
    fn walk(dir: &Path) -> Vec<TreeNode> {
        let mut nodes = Vec::new();
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if is_mdnotes(&path) {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_string();
                let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
                let mut node = TreeNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    is_dir,
                    children: Vec::new(),
                };
                if is_dir {
                    node.children = walk(&path);
                } else if !path.extension().map_or(false, |e| e == "md") {
                    continue;
                }
                nodes.push(node);
            }
        }
        nodes.sort_by(|a, b| {
            b.is_dir
                .cmp(&a.is_dir)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });
        nodes
    }
    serde_json::to_string(&walk(&root)).unwrap_or_else(|_| "[]".to_string())
}

pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn create_file(dir: String, name: String) -> Result<String, String> {
    let p = Path::new(&dir).join(name);
    if p.exists() {
        return Err("file already exists".to_string());
    }
    fs::write(&p, "").map_err(|e| e.to_string())?;
    Ok(p.to_string_lossy().to_string())
}

pub fn rename_file(old: String, new: String) -> Result<(), String> {
    fs::rename(&old, &new).map_err(|e| e.to_string())
}

pub fn delete_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p)
    } else {
        fs::remove_file(p)
    }
    .map_err(|e| e.to_string())
}

pub fn create_dir(parent: String, name: String) -> Result<(), String> {
    fs::create_dir(Path::new(&parent).join(name)).map_err(|e| e.to_string())
}

pub fn zip_vault(root: String, out: String) -> Result<(), String> {
    let root = PathBuf::from(&root);
    let out_path = PathBuf::from(&out);
    let file = fs::File::create(&out_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default();

    fn add_dir(
        zip: &mut zip::ZipWriter<fs::File>,
        options: zip::write::SimpleFileOptions,
        base: &Path,
        dir: &Path,
        out_path: &Path,
    ) -> Result<(), String> {
        for entry in fs::read_dir(dir).map_err(|e| e.to_string())?.flatten() {
            let path = entry.path();
            if is_mdnotes(&path) {
                continue;
            }
            if path == out_path {
                continue;
            }
            let rel = path
                .strip_prefix(base)
                .unwrap()
                .to_string_lossy()
                .to_string();
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                zip.add_directory(&format!("{}/", rel), options)
                    .map_err(|e| e.to_string())?;
                add_dir(zip, options, base, &path, out_path)?;
            } else {
                let mut f = fs::File::open(&path).map_err(|e| e.to_string())?;
                zip.start_file(&rel, options).map_err(|e| e.to_string())?;
                let mut buf = Vec::new();
                f.read_to_end(&mut buf).map_err(|e| e.to_string())?;
                zip.write_all(&buf).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    add_dir(&mut zip, options, &root, &root, &out_path)?;
    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_files_cmd(root: String) -> Result<String, String> {
    Ok(list_files(root))
}

#[tauri::command]
pub fn read_file_cmd(path: String) -> Result<String, String> {
    read_file(path)
}

#[tauri::command]
pub fn write_file_cmd(path: String, content: String) -> Result<(), String> {
    write_file(path, content)
}

#[tauri::command]
pub fn create_file_cmd(dir: String, name: String) -> Result<String, String> {
    create_file(dir, name)
}

#[tauri::command]
pub fn rename_file_cmd(old: String, new: String) -> Result<(), String> {
    rename_file(old, new)
}

#[tauri::command]
pub fn delete_file_cmd(path: String) -> Result<(), String> {
    delete_file(path)
}

#[tauri::command]
pub fn create_dir_cmd(parent: String, name: String) -> Result<(), String> {
    create_dir(parent, name)
}

#[tauri::command]
pub fn zip_vault_cmd(root: String, out: String) -> Result<(), String> {
    zip_vault(root, out)
}

#[tauri::command]
pub fn pick_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    Ok(app
        .dialog()
        .file()
        .blocking_pick_folder()
        .map(|p| p.to_string()))
}

#[tauri::command]
pub fn pick_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    Ok(app
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_pick_file()
        .map(|p| p.to_string()))
}

#[tauri::command]
pub fn read_vault_config_cmd(root: String) -> Result<String, String> {
    let p = Path::new(&root).join(".mdnotes").join("config.json");
    match fs::read_to_string(&p) {
        Ok(c) => Ok(c),
        Err(_) => Ok("{}".to_string()),
    }
}

#[tauri::command]
pub fn write_vault_config_cmd(root: String, config: String) -> Result<(), String> {
    let dir = Path::new(&root).join(".mdnotes");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join("config.json"), config).map_err(|e| e.to_string())
}