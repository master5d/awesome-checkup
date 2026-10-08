# Seven guards, seven failure policies

The doctrine said every guard fails closed. A measurement of seven guards found seven different behaviours when a guard could not do its check: only three blocked, some passed silently, one logged and moved on. Nobody had chosen these policies — each was an accident of its first version. Now every guard names its tier: guards on irreversible channels (secrets into git, data out to the network) fail closed; advisory guards fail open but loudly; and none may fail silently.
