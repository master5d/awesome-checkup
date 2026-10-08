# Secret printed to stdout in tool output

An agent ran a command to inspect a secret file, and the tool output included the plaintext token. The token was immediately persisted in the session's JSONL log file. The rule is now that any command interacting with secrets must use silent capture methods (like variable assignment) to ensure the value never appears in the standard output or transcript.
