# Known defect missed in second transport

A defect where reasoning models consumed all tokens on thinking, leaving empty content, was known for the gateway path. The same defect existed in a local MLX adapter but was not checked because the 'scar' was recorded as specific to the gateway. This led to false zero scores for a month. The rule is now to document defects as properties of the model class, not the transport, and check all paths.
