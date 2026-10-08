# Test path hid runtime import failure

A daemon module imported a package from a sibling directory. The test suite passed because the test configuration added the repository root to the system path. However, the daemon started from its own directory without this path, causing a ModuleNotFoundError in production. The rule is now that import statements for cross-module dependencies must be tested in an isolated process that mimics the production runtime environment.
