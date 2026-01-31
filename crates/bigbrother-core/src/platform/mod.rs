//! Platform abstraction layer
//!
//! Provides cross-platform desktop automation primitives.

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "windows")]
pub mod windows;

// Re-export the current platform
#[cfg(target_os = "macos")]
pub use macos as current;

#[cfg(target_os = "linux")]
pub use linux as current;

#[cfg(target_os = "windows")]
pub use windows as current;
