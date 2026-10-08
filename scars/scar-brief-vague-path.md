# Vague path instruction leads to key overwrite attempt

A delegation brief instructed an agent to generate a key using the 'same path as keygen'. The agent interpreted this literally and attempted to write to the host's actual configuration directory, where the real private key was stored. The operation was only prevented by a safety check that refused to overwrite an existing key. The rule is now to explicitly list every writable path in the brief and forbid writing to any other location.
