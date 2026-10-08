# Verification confirms write error

A secret rotation script wrote a key to the wrong user's home directory but reported success. The verification step used the same logic to locate the target as the write step, so it found the key in the wrong place and confirmed the error. An independent probe using a different method detected the mismatch. The rule is now to use independent logic for verification to ensure the target was actually reached.
