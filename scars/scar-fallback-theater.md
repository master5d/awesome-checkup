# Fallback chain failed to trigger due to silent backend

A gateway fallback chain was configured to switch from a local model to a cloud pool. When the local model was busy with another task, it did not return an error but held the connection open. The router waited for the global timeout (120s) before attempting the fallback, causing the client to time out. The fallback was declared but never executed because the backend was silent, not broken. The rule is now to set per-deployment timeouts tuned to real workload latency, not health checks.
