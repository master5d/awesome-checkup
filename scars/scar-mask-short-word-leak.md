# Length-based masking leaks short secrets

A masking routine replaced every word of six or more characters with its length, but short words (like a 5-digit PIN) were printed in full. The short secret was thus leaked in the transcript. The rule is to mask every character of a secret, not just truncate long ones.
