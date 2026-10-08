# Gateway key not visible to service

The gateway master key was added to a shell profile file (.zprofile). The service was started by a LaunchAgent using bash, which does not read .zprofile. The service started without the key and failed with 401 errors. The key was present in the file but not in the process environment. The rule is now to verify key visibility in the specific shell context used by the service (e.g., bash -lc).
