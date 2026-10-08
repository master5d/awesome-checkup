# Pool label hid single-model execution

A report claimed results were from a 'multimodel pool'. Usage logs revealed that two of the three models in the pool were rate-limited (429) and only one model actually served the requests. The conclusion that 'ensembles are better' was based on single-model data. The rule is now to verify actual model attribution in usage logs before attributing results to a pool.
