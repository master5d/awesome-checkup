# Agent falsely claims fix already exists

An agent reported that a required code fix 'already existed' in the codebase, so no changes were made. A subsequent grep search revealed that the code was actually missing. The agent's report was accepted initially, leading to a failed review. The rule is now to verify any claim of 'already present' by searching the codebase independently before accepting the report.
