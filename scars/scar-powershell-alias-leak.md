# PowerShell alias prints secret in error message

An agent tried to hash a secret by passing it as an argument to a custom function, but the function name collided with a built-in alias. The error message from the alias printed the secret value in full. The rule is to pass secrets via stdin or internal variables, never as positional arguments, to avoid exposure in error messages.
