# Fallback token substituted wrong identity

A bot configuration used a fallback token for when the primary token was missing. The fallback token belonged to a different, personal bot. When the primary token failed, the system started sending messages as the personal bot, impersonating the owner. The error was invisible because the API returned 200 OK. The rule is now that identity fallbacks must fail closed; only capacity fallbacks (different models/providers) are allowed to be silent.
