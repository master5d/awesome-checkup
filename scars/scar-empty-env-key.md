# Empty environment variable mimics configuration

A check for the presence of an environment variable name passed, but the value was empty. The service silently failed to send notifications, assuming the configuration was valid. The rule is to verify that secret environment variables have non-empty values, not just that they exist.
