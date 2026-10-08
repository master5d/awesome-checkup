# Silent Index Truncation

The memory index grew beyond the harness's limit of 25,000 units. The harness silently truncated the index, removing critical instructions from the agent's context. The agent began making errors because it no longer 'remembered' key constraints. The rule now includes a monitor that alerts when the index approaches the limit, allowing the owner to prune or reorganize before truncation occurs.
