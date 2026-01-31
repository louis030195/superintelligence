//! macOS platform implementation
//!
//! Uses Accessibility API (AX) and Core Graphics (CG) via cidre.

use cidre::ax;

/// Check if the process has accessibility permissions
pub fn has_accessibility() -> bool {
    ax::is_process_trusted()
}

/// Request accessibility permissions with a prompt
pub fn request_accessibility() -> bool {
    ax::is_process_trusted_with_prompt(true)
}

/// Ensure accessibility permissions are granted
pub fn ensure_accessibility() -> crate::Result<()> {
    if has_accessibility() {
        return Ok(());
    }
    request_accessibility();
    Err(crate::Error::permission_denied(
        "Accessibility permissions required. Enable in System Settings > Privacy & Security > Accessibility"
    ))
}
