# Hash compare with different extractors

A secret comparison reported a mismatch because two different extraction methods were used for the two sides of the comparison. One method trimmed whitespace, the other did not. The rule is now to use a single extraction and normalization function for all sides of a hash comparison to ensure accuracy.
