//! bigbrother-recorder - Cross-platform workflow recording
//!
//! Efficient recording of user interactions with UI element context.
//! Optimized for AI consumption.
//!
//! ## Platform Support
//!
//! - **macOS**: Full support via CGEventTap
//! - **Linux**: Coming soon (libevdev)
//! - **Windows**: Coming soon (Windows hooks)

pub mod events;
pub mod platform;
pub mod storage;

#[cfg(target_os = "macos")]
pub mod recorder;
#[cfg(target_os = "macos")]
pub mod replay;

pub use events::*;

#[cfg(target_os = "macos")]
pub use recorder::{
    EventStream, PermissionStatus, RecorderConfig, RecordingHandle, Receiver, Sender,
    WorkflowRecorder,
};
#[cfg(target_os = "macos")]
pub use replay::Replayer;

pub use storage::WorkflowStorage;

pub mod prelude {
    pub use crate::events::*;
    pub use crate::storage::WorkflowStorage;

    #[cfg(target_os = "macos")]
    pub use crate::recorder::{
        EventStream, PermissionStatus, RecorderConfig, RecordingHandle, Receiver, Sender,
        WorkflowRecorder,
    };
    #[cfg(target_os = "macos")]
    pub use crate::replay::Replayer;
}
