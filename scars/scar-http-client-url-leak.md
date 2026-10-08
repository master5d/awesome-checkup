# HTTP client logs full URL with secret

A daemon using an HTTP client library logged the full request URL at INFO level, which included the API token in the path. The application code had sanitized its own logs, but the third-party library's logger bypassed this protection. The rule is to explicitly suppress INFO-level logging for HTTP clients or scrub URLs before they reach the log file.
