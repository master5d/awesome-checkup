# Diagnostic tool dumps environment variables

A diagnostic tool run with a machine-readable flag printed the entire process environment, including all provider API keys, to stdout. The user assumed the tool was safe because it was read-only, but the output was captured in the session log. The rule is to scrub environment variables from diagnostic outputs or run such tools in an isolated environment without secrets.
