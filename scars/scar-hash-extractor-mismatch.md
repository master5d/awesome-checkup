# False mismatch due to extraction differences

Two different scripts extracted a secret value from a YAML file and an environment file, respectively, and compared their SHA256 hashes. The hashes differed, leading to the conclusion that the secrets were different and requiring a new rotation route. A later check using a single normalization script for both sources revealed the values were identical, with the difference caused by whitespace handling. The rule is now that secret comparisons must use a single, shared extraction and normalization function for all sides.
