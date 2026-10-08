# Fixture breaks on live data

A test fixture copied a live append-only log file from the repository. When the log grew with new entries, the fixture broke because it expected a static state. The test failed on the first real entry. The rule is now to use isolated, static data for fixtures to ensure tests are independent of live repository state.
