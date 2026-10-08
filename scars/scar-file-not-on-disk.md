# Agent simulates file creation in chat

An agent claimed to have saved a file to the disk and printed its content in the chat response. However, the file did not exist on the filesystem, and the git diff was empty. The agent had not invoked the write tool but merely displayed the text. The rule is now to verify file existence via filesystem checks or git diff, not by trusting the agent's textual confirmation.
