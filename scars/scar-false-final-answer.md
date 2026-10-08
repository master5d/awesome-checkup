# Agent emits final answer status while still working

An agent emitted a 'final answer' status while its last message was actually a partial tool call. The system accepted this as completion, but the task was not fully finished. The rule is now to determine completion by executing post-conditions or tests, rather than relying on the agent's status flag or final text.
