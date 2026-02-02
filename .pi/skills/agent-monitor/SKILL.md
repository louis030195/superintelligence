---
name: agent-monitor
description: Monitor all Pi agents running in WezTerm panes. Shows what each agent is doing (task + current action). Use periodically to coordinate multiple agents.
---

# Agent Monitor

Check what each Pi agent is doing.

## Run Status Check

```bash
echo "🧠 AGENT STATUS - $(date '+%H:%M:%S')"
echo ""

PANES=$(bb wezterm list 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$PANES" ]; then
  echo "⚠️  WezTerm not accessible. Return to WezTerm to see full status."
  echo ""
  for dir in ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-*; do
    [ ! -d "$dir" ] && continue
    PROJECT=$(basename "$dir" | sed 's/--Users-louisbeaumont-Documents-//' | sed 's/--$//')
    SESSION=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1)
    [ -z "$SESSION" ] && continue
    STOP=$(tail -1 "$SESSION" | jq -r '.message.stopReason // "working"')
    ROLE=$(tail -1 "$SESSION" | jq -r '.message.role // "unknown"')
    [ "$STOP" = "stop" ] && [ "$ROLE" = "assistant" ] && STATUS="✅ IDLE" || STATUS="🔄 WORKING"
    TASK=$(tail -100 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content | if type=="array" then .[0].text else . end' 2>/dev/null | tail -1 | cut -c1-60)
    echo "**$PROJECT** - $STATUS"
    echo "Task: $TASK"
    echo ""
  done
  exit 0
fi

echo "$PANES" | jq -r '.data[] | "\(.pane_id)|\(.title)|\(.cwd)"' | while IFS='|' read -r PANE_ID TITLE CWD; do
  CWD_CLEAN=$(echo "$CWD" | sed 's|file://||')
  PROJECT=$(echo "$CWD_CLEAN" | xargs basename 2>/dev/null || echo "unknown")
  
  [[ "$TITLE" != *"π"* ]] && continue
  
  SESSION_PATH=$(echo "$CWD_CLEAN" | sed 's|/|-|g' | sed 's|^-||')
  SESSION=$(ls -t "$HOME/.pi/agent/sessions/--${SESSION_PATH}--"/*.jsonl 2>/dev/null | head -1)
  [ -z "$SESSION" ] && continue
  
  STOP=$(tail -1 "$SESSION" | jq -r '.message.stopReason // "working"')
  ROLE=$(tail -1 "$SESSION" | jq -r '.message.role // "unknown"')
  [ "$STOP" = "stop" ] && [ "$ROLE" = "assistant" ] && STATUS="✅ IDLE" || STATUS="🔄 WORKING"
  
  TASK=$(tail -100 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content | if type=="array" then .[0].text else . end' 2>/dev/null | tail -1 | cut -c1-60)
  
  DOING=$(tail -20 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="assistant") | .message.content | if type=="array" then [.[] | select(.type=="toolCall") | .name] | join(",") else "thinking" end' 2>/dev/null | tail -1)
  [ -z "$DOING" ] && DOING="-"
  
  echo "---"
  echo "**Pane $PANE_ID** ($PROJECT) - $STATUS"
  echo "Task: $TASK"
  echo "Doing: $DOING"
done

echo ""
echo "---"
```

## After Status Check

Report summary and suggest actions:

1. **Idle agents** → Assign new tasks: `bb wezterm send <pane> "task"`
2. **Working agents** → Wait or check if stuck
3. **Duplicate work** → Multiple agents on same task? Stop extras
4. **Blocked** → Agent stuck? Send help or restart

## Quick Actions

```bash
# Assign task to idle agent
bb wezterm send <pane_id> "your task"

# Check detailed progress
tail -30 <session_file> | jq '.message'

# Interrupt stuck agent (sends to pane)
bb wezterm send <pane_id> "stop and summarize what you did"
```
