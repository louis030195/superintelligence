# BigBrother - Multi-Agent Orchestration

Coordinate multiple Pi coding agents running in WezTerm panes.

## Quick Reference

```bash
# List all panes
bb wezterm list | jq -r '.data[] | "\(.pane_id): \(.title)"'

# Send to a pane
bb wezterm send <pane_id> "your prompt"

# Check if agent is idle
SESSION=$(ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-<project>--/*.jsonl | head -1)
tail -1 "$SESSION" | jq '.message.stopReason'  # "stop" = idle
```

## Skills

- `/skill:wezterm-orchestrator` - Pane control commands
- `/skill:pi-session-reader` - Monitor agent sessions

## Typical Pane Layout

```
┌─────────────────┬─────────────────┐
│ Pane 0          │ Pane 3          │
│ π screenpipe    │ π screenpipe    │
│ (backend)       │ (backend 2)     │
├─────────────────┼─────────────────┤
│ Pane 1          │ Pane 2/4        │
│ bun (frontend)  │ π brain         │
│                 │ (orchestrator)  │
└─────────────────┴─────────────────┘
```

Run `bb wezterm list` for current layout.

## Workflow

1. `bb wezterm list` - discover panes
2. Check agent status via session files
3. `bb wezterm send <id> "task"` - delegate
4. Monitor progress
5. Repeat

## Build bb

```bash
cd ~/Documents/bigbrother && cargo build --release -p bb
```
