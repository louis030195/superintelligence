---
name: wezterm-orchestrator
description: Control WezTerm panes - list panes, send commands to Pi agents, monitor their status. Use when coordinating multiple terminal sessions or coding agents.
---

# WezTerm Orchestrator

Control multiple WezTerm panes and Pi agents programmatically.

## List Panes

```bash
bb wezterm list
```

Quick summary:
```bash
bb wezterm list | jq -r '.data[] | "\(.pane_id): \(.title) - \(.cwd | sub("file://"; ""))"'
```

## Send to a Pane

```bash
bb wezterm send <pane_id> "your prompt here"
```

Without pressing enter:
```bash
bb wezterm send <pane_id> "partial" --no-enter
```

## Focus a Pane

```bash
bb wezterm focus <pane_id>
```

## Find Pi Agent Panes

```bash
bb wezterm list | jq -r '.data[] | select(.title | contains("π")) | {pane_id, title, cwd}'
```

## Broadcast to All Pi Agents

```bash
for id in $(bb wezterm list | jq -r '.data[] | select(.title | contains("π")) | .pane_id'); do
  echo "Sending to pane $id..."
  bb wezterm send $id "check for compilation errors and fix them"
  sleep 2
done
```

## Common Workflows

### Parallel task assignment
```bash
bb wezterm send 0 "implement the backend API for user auth"
bb wezterm send 1 "create the frontend login form"
```

### Sequential with dependency
```bash
bb wezterm send 0 "run the tests"
# Wait for completion, then:
bb wezterm send 1 "review the test results and fix failures"
```

### Code review pattern
```bash
bb wezterm send 0 "implement feature X"
# After completion:
bb wezterm send 3 "review the changes in the last commit, suggest improvements"
```

## Notes

- Pane IDs are stable within a WezTerm session
- Always list panes first to get current IDs
- Add `sleep 2` between broadcasts to avoid overwhelming agents
- Use `/skill:pi-session-reader` to check agent progress
