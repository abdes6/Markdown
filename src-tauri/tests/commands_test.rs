use std::fs;
use tempfile::tempdir;
use markdown_notes_lib::commands;

#[test]
fn write_then_read_roundtrip() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("a.md");
    commands::write_file(path.to_str().unwrap().to_string(), "# Hello".to_string());
    let content = commands::read_file(path.to_str().unwrap().to_string()).unwrap();
    assert_eq!(content, "# Hello");
}

#[test]
fn list_files_returns_recursive_tree() {
    let dir = tempdir().unwrap();
    fs::create_dir(dir.path().join("sub")).unwrap();
    fs::write(dir.path().join("sub/b.md"), "b").unwrap();
    let json = commands::list_files(dir.path().to_str().unwrap().to_string());
    assert!(json.contains("sub"));
    assert!(json.contains("b.md"));
    assert!(json.contains(".mdnotes") == false);
}

#[test]
fn zip_vault_excludes_mdnotes() {
    let dir = tempdir().unwrap();
    fs::create_dir(dir.path().join(".mdnotes")).unwrap();
    fs::write(dir.path().join(".mdnotes/index.json"), "{}").unwrap();
    fs::write(dir.path().join("n.md"), "n").unwrap();
    let out = dir.path().join("out.zip");
    commands::zip_vault(
        dir.path().to_str().unwrap().to_string(),
        out.to_str().unwrap().to_string(),
    );
    let file = std::fs::File::open(&out).unwrap();
    let mut archive = zip::ZipArchive::new(file).unwrap();
    assert_eq!(archive.len(), 1);
    let entry = archive.by_index(0).unwrap();
    assert_eq!(entry.name(), "n.md");
}