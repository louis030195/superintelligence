//! macOS Automation Library using cidre
//!
//! A collection of utilities for automating macOS applications using
//! the Accessibility APIs via the cidre crate.
//!
//! ## Features
//!
//! - **accessibility**: Query and interact with UI elements
//! - **apps**: Find and control running applications
//! - **input**: Simulate keyboard and mouse input
//! - **scrape**: Extract text content from application UIs

pub mod accessibility;
pub mod apps;
pub mod input;
pub mod scrape;

pub use accessibility::*;
pub use apps::*;
pub use input::*;
pub use scrape::*;

use anyhow::Result;
use cidre::ax;

/// Check and request accessibility permissions
pub fn ensure_accessibility() -> Result<()> {
    if ax::is_process_trusted() {
        return Ok(());
    }

    ax::is_process_trusted_with_prompt(true);
    anyhow::bail!(
        "Accessibility permissions required. \
        Enable in System Settings > Privacy & Security > Accessibility"
    );
}

/// Check if accessibility permissions are granted
pub fn has_accessibility() -> bool {
    ax::is_process_trusted()
}
