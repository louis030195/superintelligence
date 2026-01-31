//! Application finding and management utilities

use anyhow::{Context, Result};
use cidre::arc::R;
use cidre::ax;
use std::process::Command;

/// Common browser application names
pub const BROWSERS: &[&str] = &[
    "Arc",
    "Google Chrome",
    "Safari",
    "Firefox",
    "Brave Browser",
    "Microsoft Edge",
    "Opera",
    "Vivaldi",
];

/// Find the PID of a running application by name
pub fn find_app_pid(app_name: &str) -> Result<i32> {
    let output = Command::new("pgrep")
        .arg("-x")
        .arg(app_name)
        .output()
        .context("Failed to run pgrep")?;

    if output.status.success() {
        let pid_str = String::from_utf8_lossy(&output.stdout);
        if let Some(first_line) = pid_str.lines().next() {
            if let Ok(pid) = first_line.trim().parse::<i32>() {
                return Ok(pid);
            }
        }
    }

    anyhow::bail!("Application '{}' not found running", app_name)
}

/// Find any running application from a list of names
pub fn find_any_app(app_names: &[&str]) -> Result<(String, i32)> {
    for name in app_names {
        if let Ok(pid) = find_app_pid(name) {
            return Ok((name.to_string(), pid));
        }
    }
    anyhow::bail!("No matching application found")
}

/// Find a running browser
pub fn find_browser() -> Result<(String, i32)> {
    find_any_app(BROWSERS)
}

/// Get the UI element for an application by PID
pub fn get_app_element(pid: i32) -> Result<R<ax::UiElement>> {
    let app = ax::UiElement::with_app_pid(pid);

    // Verify we can access it
    app.role()
        .context("Failed to access application - check accessibility permissions")?;

    Ok(app)
}

/// Get the UI element for an application by name
pub fn get_app_by_name(app_name: &str) -> Result<R<ax::UiElement>> {
    let pid = find_app_pid(app_name)?;
    get_app_element(pid)
}

/// Get the UI element for a browser
pub fn get_browser() -> Result<(String, R<ax::UiElement>)> {
    let (name, pid) = find_browser()?;
    let element = get_app_element(pid)?;
    Ok((name, element))
}

/// Open a URL in the default browser
pub fn open_url(url: &str) -> Result<()> {
    Command::new("open")
        .arg(url)
        .spawn()
        .context("Failed to open URL")?;
    Ok(())
}

/// Activate (bring to front) an application by name
pub fn activate_app(app_name: &str) -> Result<()> {
    let script = format!(
        r#"tell application "{}" to activate"#,
        app_name
    );

    Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .context("Failed to activate application")?;

    Ok(())
}

/// List all running applications
pub fn list_running_apps() -> Result<Vec<String>> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(r#"tell application "System Events" to get name of every process whose background only is false"#)
        .output()
        .context("Failed to list applications")?;

    let apps_str = String::from_utf8_lossy(&output.stdout);
    Ok(apps_str
        .split(", ")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect())
}
