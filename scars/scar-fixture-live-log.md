# Fixture broke on first real entry

A test used a live append-only log file as a fixture base. The test wrote entries with specific IDs to this copy. When the first real production entry with the same ID was written to the live log, the test failed due to duplicate IDs. The rule is now that test fixtures copying live logs must filter out entries that the test itself generates or modifies.
