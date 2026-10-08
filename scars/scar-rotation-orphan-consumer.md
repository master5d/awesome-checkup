# Key rotation orphans consumers on other nodes

A master key was rotated on the central node, but a consumer on another node continued to use the old key from its environment. The consumer failed with authentication errors, but the container status remained 'Up', hiding the issue. The rule is to verify that all consumers have updated their keys after rotation, using hash comparison.
