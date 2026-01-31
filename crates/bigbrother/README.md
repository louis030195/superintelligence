# bigbrother

macOS desktop automation and workflow recording for AI agents.

## Features

- **Recording**: Capture clicks, mouse moves, scrolls, keyboard, app/window switches, clipboard
- **Replay**: Full playback using CGEventPost
- **Automation**: Click, type, scroll, find elements, scrape text
- **AI-friendly**: Compact JSON output, structured for LLM consumption
- **Efficient**: 2 lightweight threads, smart clipboard detection via Cmd+C/X/V
- **Streaming API**: Consume events in real-time from other crates

## Requirements

- macOS 10.15+
- Accessibility permission
- Input Monitoring permission

## CLI

```bash
# Check permissions
bb permissions

# === Recording ===
bb record -n my-workflow     # Record (Ctrl+C to stop)
bb list                      # List recordings
bb show workflow.jsonl       # Show recording info
bb replay workflow.jsonl     # Replay at 1x speed
bb replay workflow.jsonl -s 2.0  # Replay at 2x speed

# === Automation ===
bb apps                      # List running apps
bb activate Safari           # Focus an app
bb tree --app Safari         # Get accessibility tree
bb find "role:Button" --app Safari  # Find elements
bb click "role:Button AND name:Submit" --app Safari
bb type "hello world"        # Type text
bb scroll --direction down --pages 2
bb press return              # Press a key
bb shortcut c --modifier cmd # Cmd+C
bb open "https://example.com"
bb scrape --app Safari       # Extract text
```

## Output Format

Events are stored as JSON lines (`.jsonl`):

```json
{"t":100,"e":"c","x":500,"y":300,"b":0,"n":1,"m":0}
{"t":150,"e":"m","x":520,"y":310}
{"t":200,"e":"k","k":0,"m":8}
{"t":250,"e":"t","s":"hello world"}
{"t":300,"e":"a","n":"Safari","p":1234}
{"t":310,"e":"w","a":"Safari","w":"GitHub - bigbrother"}
{"t":350,"e":"p","o":"c","s":"copied text"}
{"t":400,"e":"x","r":"AXButton","n":"Submit"}
```

Event types:
- `c`: click (x, y, button, clicks, modifiers)
- `m`: mouse move (x, y)
- `s`: scroll (x, y, dx, dy)
- `k`: key press (keycode, modifiers)
- `t`: text input (aggregated string)
- `a`: app switch (name, pid)
- `w`: window focus (app name, window title)
- `p`: clipboard (operation: c=copy, x=cut, v=paste)
- `x`: context (role, name, value)

## Library Usage

```rust
use bigbrother::prelude::*;

// Record
let recorder = WorkflowRecorder::new();
let (mut workflow, handle) = recorder.start("demo")?;
// ... user actions ...
handle.stop(&mut workflow);

// Save & Load
let storage = WorkflowStorage::new()?;
storage.save(&workflow)?;
let workflow = storage.load("demo.jsonl")?;

// Replay
Replayer::new().speed(2.0).play(&workflow)?;

// Stream events
let stream = recorder.stream()?;
for event in stream {
    println!("{:?}", event);
}
```

## Architecture

Two parallel threads:
1. **Event Tap** (CGEventTap): Mouse/keyboard/clipboard capture
2. **App Observer**: Polls frontmost app every 100ms

Events flow through a lock-free crossbeam channel.
