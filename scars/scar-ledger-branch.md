# Parallel Session Ledger Conflict

Two sessions ran in parallel and both appended entries to the memory ledger. When the repository was merged, the text-based merge created a broken hash chain because the sequence numbers conflicted. The integrity check failed silently until a session start revealed the broken chain. The rule now requires a specific merge driver that re-links the hash chain correctly when parallel sessions are merged.
