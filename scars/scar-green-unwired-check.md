# Green run due to unwired acceptance check

A new agent tier was introduced, and the first run was marked as 'green'. However, the acceptance check for this tier was not properly wired due to a format mismatch in the tool call parsing. The check was silently skipped. The rule is now to explicitly verify that all acceptance checks are enabled and compatible with the new agent tier's output format.
