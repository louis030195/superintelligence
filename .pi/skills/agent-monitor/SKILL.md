---
name: agent-monitor
description: Monitor all Pi agents running in WezTerm panes. Shows status table (idle/working), last task, and suggests actions. Use periodically to coordinate multiple agents.
---

# Agent Monitor

Check status of all Pi agents and suggest actions.

## Run Status Check

```bash
echo "🧠 AGENT STATUS - $(date '+%H:%M:%S')"
echo ""
echo "| Pane | Project | Status | Last Task |"
echo "|------|---------|--------|-----------|"

bb wezterm list 2>/dev/null | jq -r '.data[] | "\(.pane_id)|\(.title)|\(.cwd)"' | while IFS='|' read -r PANE_ID TITLE CWD; do
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

## After Running Status Check

Analyze the table and:

1. **Identify idle agents** (✅ idle) - these can receive new tasks
2. **Check working agents** (🔄 working) - monitor or wait for completion
3. **Suggest actions** based on:
   - Are there idle agents that could help?
   - Are agents stuck or taking too long?
   - Are there tasks that should be delegated?

## Assign Task to Idle Agent

```bash
bb wezterm send <pane_id> "your task description"
```

## Check What an Agent is Doing

```bash
SESSION=$(ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-<project>--/*.jsonl | head -1)
tail -20 "$SESSION" | jq -r 'select(.type=="message") | "\(.message.role): \(.message.content | if type=="array" then .[0].text[:100] else .[:100] end)"'
```

## Suggest Actions Format

After checking status, report:

```
**Status Summary:**
- X agents idle, Y agents working
- Projects: list active projects

**Suggested Actions:**
1. [If idle agents exist] Assign task X to pane Y
2. [If agents working] Wait for completion / Check progress
3. [If blocked] Investigate issue in pane Z
```
