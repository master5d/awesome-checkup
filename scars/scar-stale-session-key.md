# Long session holds stale key after rotation

A long-running session held a copy of an API key from before a rotation. When the key was rotated, the session continued to use the old key, causing errors that looked like infrastructure failures. The rule is to check the hash of the key in the current process against the source of truth when authentication fails.
