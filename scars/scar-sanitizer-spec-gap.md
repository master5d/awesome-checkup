# Sanitizer created the danger it removed

A sanitizer was written to strip markdown headings based on a standard specification, but the consumer parser treated any line starting with '#' as a heading. The sanitizer stripped six hashes from a line with seven, leaving one, which the consumer then interpreted as a heading. This created a dangerous structure from a safe input. The rule is now that sanitizers must be defined by the logic of the consuming parser, not a generic specification.
