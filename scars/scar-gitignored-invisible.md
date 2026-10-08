# Agent cannot find files in gitignored directories

A delegation brief referenced a file in a gitignored directory using a relative path. The agent used a search tool that respects .gitignore and reported the file as missing. The rule is now to provide absolute paths and explicit instructions to read files directly if they are in gitignored directories.
