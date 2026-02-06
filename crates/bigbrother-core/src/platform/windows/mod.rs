//! Windows platform implementation
//!
//! Uses UI Automation API for accessibility and Win32 for input.

mod accessibility;
mod input;

pub use accessibility::*;
pub use input::*;

use crate::{Error, ErrorCode, Result};

/// Check if UI Automation is available (always true on Windows)
pub fn has_accessibility() -> bool {
    // UI Automation is built into Windows Vista+
    true
}

/// Request accessibility permissions (no-op on Windows)
pub fn request_accessibility() -> bool {
    // Windows doesn't require explicit permissions for UI Automation
    true
}

/// Ensure accessibility is available
pub fn ensure_accessibility() -> Result<()> {
    // Initialize COM for UI Automation
    init_com()?;
    Ok(())
}

/// Initialize COM for the current thread
pub fn init_com() -> Result<()> {
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_MULTITHREADED};

    unsafe {
        let hr = CoInitializeEx(None, COINIT_MULTITHREADED);
        // S_OK (0) and S_FALSE (1 = already initialized) are both fine
        if hr.0 == 0 || hr.0 == 1 {
            Ok(())
        } else {
            Err(Error::new(
                ErrorCode::Unknown,
                format!("Failed to initialize COM: HRESULT 0x{:08X}", hr.0),
            ))
        }
    }
}
