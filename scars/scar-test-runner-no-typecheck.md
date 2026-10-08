# Green tests, broken build

A project had a type error that caused the build to fail, but the test suite remained green because the test runner transpiled the code without type-checking. The error persisted for a month because the type check was only run during deployment, which was broken for other reasons. The rule is now that type-checking must be integrated into the daily test or build pipeline to ensure 'green tests' imply a healthy codebase.
