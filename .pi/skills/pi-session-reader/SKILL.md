---
name: pi-session-reader
description: Read Pi agent sessions to monitor what other agents are doing, check their status (busy/idle), and understand their conversation history.
---

# Pi Session Reader

Monitor Pi agents by reading their session files.

## Session Location

```
~/.pi/agent/sessions/--<path-with-dashes>--/<timestamp>_<uuid>.jsonl
```

## Find Latest Session for a Project

```bash
# Screenpipe
ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-screenpipe--/*.jsonl | head -1

# Brain
ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-brain--/*.jsonl | head -1

# Generic pattern
ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-<project>--/*.jsonl | head -1
```

## Check Agent Status (Busy or Idle)

```bash
SESSION=$(ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-screenpipe--/*.jsonl | head -1)
tail -1 "$SESSION" | jq '{role: .message.role, stopReason: .message.stopReason}'
```

- `stopReason: "stop"` + `role: "assistant"` = **Idle** (ready for new task)
- `role: "toolResult"` or `stopReason: null` = **Busy** (still working)

## Read Recent Conversation

```bash
SESSION=$(ls -t ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-screenpipe--/*.jsonl | head -1)
tail -30 "$SESSION" | jq -r 'select(.type=="message") | "\(.message.role): \(.message.content | if type=="array" then (.[0].text // .[0].type) else . end | tostring | .[0:150])"'
```

## Get Last User Prompt

```bash
tail -100 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content' | tail -1
```

## Monitor All Active Sessions

```bash
for dir in ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-*; do
  PROJECT=$(basename "$dir" | sed 's/--Users-louisbeaumont-Documents-//' | sed 's/--$//')
  SESSION=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1)
  if [ -n "$SESSION" ]; then
    STATUS=$(tail -1 "$SESSION" | jq -r '.message.stopReason // "working"')
    echo "$PROJECT: $STATUS"
  fi
done
```

## Full Agent Status Dashboard

```bash
echo "=== Pi Agent Status ==="
for dir in ~/.pi/agent/sessions/--Users-louisbeaumont-Documents-*; do
  PROJECT=$(basename "$dir" | sed 's/--Users-louisbeaumont-Documents-//' | sed 's/--$//')
  SESSION=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1)
  if [ -n "$SESSION" ]; then
    LAST=$(tail -1 "$SESSION" | jq -r '{role: .message.role, stop: .message.stopReason}')
    ROLE=$(echo "$LAST" | jq -r '.role')
    STOP=$(echo "$LAST" | jq -r '.stop')
    if [ "$STOP" = "stop" ] && [ "$ROLE" = "assistant" ]; then
      STATUS="✅ Idle"
    else
      STATUS="🔄 Working"
    fi
    TASK=$(tail -50 "$SESSION" | jq -r 'select(.type=="message" and .message.role=="user") | .message.content | if type=="array" then .[0].text else . end' 2>/dev/null | tail -1 | head -c 60)
    echo "$PROJECT: $STATUS - $TASK..."
  fi
done
```

## Session Format Reference

Each line is JSON:
- `type: "session"` - Header
- `type: "message"` - Conversation (role: user/assistant/toolResult)
- `type: "compaction"` - Context was summarized

Message structure:
```json
{"type":"message","message":{"role":"user","content":"hello"}}
{"type":"message","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}],"stopReason":"stop"}}
{"type":"message","message":{"role":"toolResult","toolName":"bash","content":[{"type":"text","text":"output"}]}}
```
