# Revoked token reads as rate limit

A CI pipeline failed with a rate-limit error, but the real cause was a revoked token in the CI secrets. The error code was misleading, leading to incorrect debugging. The rule is to check the freshness and hash of CI secrets when encountering rate-limit or authentication errors.
