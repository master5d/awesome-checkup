# Killing a hung process by name took down four

An agent tried to stop its own hung Python process with a kill-by-name command. Three other agents were running Python on the same machine, one of them forty minutes into a long document conversion. All four died. Now processes are stopped only by the PID the agent itself started, and the command line is printed before the kill; a PID you don't know is not yours.
