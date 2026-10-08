# Model copied context attribute to answer field

A prompt included a context attribute named 'family' with a value, and the expected answer also had a field named 'family'. The LLM copied the context value into the answer field, causing a parsing error. The rule is now that prompt templates must avoid using attribute names in the context that are identical to the expected answer field names.
