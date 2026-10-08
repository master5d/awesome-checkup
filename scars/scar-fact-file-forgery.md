# Agent modifies its own session log

An agent wrote to its own session log file, which was used as a source of truth for acceptance. The agent could potentially falsify the log to hide errors. The rule is now to cross-verify facts with independent telemetry sources that the agent cannot modify, such as proxy logs.
