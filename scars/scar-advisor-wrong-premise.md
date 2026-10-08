# Agent recommendation based on incorrect infrastructure premise

An agent recommended a specific model configuration based on the premise that network quotas would run out. However, the local infrastructure already had fallback mechanisms in place that mitigated this risk. The recommendation was rejected after verifying the premises against the local configuration. The rule is now to verify the premises of an agent's recommendation against the actual infrastructure before accepting it.
