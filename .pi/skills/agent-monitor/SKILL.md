---
name: agent-monitor
description: Monitor all Pi agents running in WezTerm panes. Shows status table (idle/working), last task, and suggests actions. Use periodically to coordinate multiple agents.
---

# Agent Monitor

Check status of all Pi agents and suggest actions.

## Run Status Check

```bash
# Check if wezterm is accessible (user might be in another app)
PANES=$(bb wezterm list 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$PANES" ]; then
  echo "⚠️  WezTerm not accessible (user may be in another app). Checking sessions only..."
  echo ""
  
  # Fallback: just check sessions without pane info
  echo "| Project | Status | Last Task |"
  echo "|---------|--------|-----------|"
  for dir in ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-*; do
    [ ! -d "$dir" ] && continue
    PROJECT=$(basename "$dir" | sed 's/--Users-louisbeaumont-Documents-//' | sed 's/--$//')
    SESSION=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1)
    [ -z "$SESSION" ] && continue
    
    STOP=$(tail -1 "$SESSION" | jq -r '.message.stopReason // "working"')
    ROLE=$(tail -1 "$SESSION" | jq -r '.message.role // "unknown"')
    [ "$STOP" = "stop" ] && [ "$ROLE" = "assistant" ] && STATUS="✅ idle" || STATUS="🔄 working"
    
    TASK=$(tail -50 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content | if type=="array" then .[0].text else . end' 2>/dev/null | tail -1 | cut -c1-30)
    [ -z "$TASK" ] && TASK="-"
    echo "| $PROJECT | $STATUS | ${TASK}... |"
  done
  exit 0
fi

echo "🧠 AGENT STATUS - $(date '+%H:%M:%S')"
echo ""
echo "| Pane | Project | Status | Last Task |"
echo "|------|---------|--------|-----------|"

echo "$PANES" | jq -r '.data[] | "\(.pane_id)|\(.title)|\(.cwd)"' | while IFS='|' read -r PANE_ID TITLE CWD; do
  CWD_CLEAN=$(echo "$CWD" | sed 's|file://||')
  PROJECT=$(echo "$CWD_CLEAN" | xargs basename 2>/dev/null || echo "unknown")
  
  if [[ "$TITLE" != *"π"* ]]; then
    echo "| $PANE_ID | $PROJECT | ⚙️ other | - |"
    continue
  fi
  
  SESSION_PATH=$(echo "$CWD_CLEAN" | sed 's|/|-|g' | sed 's|^-||')
  SESSION=$(ls -t "$HOME/.pi/agent/sessions/--${SESSION_PATH}--"/*.jsonl 2>/dev/null | head -1)
  
  if [ -z "$SESSION" ]; then
    echo "| $PANE_ID | $PROJECT | ❓ no session | - |"
    continue
  fi
  
  STOP=$(tail -1 "$SESSION" | jq -r '.message.stopReason // "working"')
  ROLE=$(tail -1 "$SESSION" | jq -r '.message.role // "unknown"')
  
  if [ "$STOP" = "stop" ] && [ "$ROLE" = "assistant" ]; then
    STATUS="✅ idle"
  else
    STATUS="🔄 working"
  fi
  
  TASK=$(tail -50 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content | if type=="array" then .[0].text else . end' 2>/dev/null | tail -1 | cut -c1-30)
  [ -z "$TASK" ] && TASK="-"
  
  echo "| $PANE_ID | $PROJECT | $STATUS | ${TASK}... |"
done
```

## Notes

- If WezTerm isn't focused, falls back to session-only monitoring (no pane IDs)
- Session files always accessible regardless of which app is active
- To send commands, user must return to WezTerm first

## After Running Status Check

Analyze the table and:

1. **Identify idle agents** (✅ idle) - these can receive new tasks
2. **Check working agents** (🔄 working) - monitor or wait
3. **If WezTerm not accessible** - can still see status, but wait for user to return before sending tasks

## Assign Task (requires WezTerm focused)

```bash
bb wezterm send <pane_id> "your task description"
```

## Suggest Actions Format

```
**Status Summary:**
- X agents idle, Y agents working

**Suggested Actions:**
1. [action based on status]

**Note:** [If WezTerm not accessible] Return to WezTerm to send tasks
```
