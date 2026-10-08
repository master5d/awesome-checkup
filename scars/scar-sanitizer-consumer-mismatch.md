# Sanitizer and consumer disagree

A sanitizer stripped markdown headings based on a generic specification, but the consumer's parser defined headings differently. This mismatch allowed dangerous content to pass through the sanitizer and be interpreted as a heading by the consumer. The rule is now to define sanitization logic based on the consumer's parser criteria to ensure safety.
