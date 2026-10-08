# Prompt field collision

A prompt for an LLM included a context attribute named 'family' and an output field also named 'family'. The model copied the context value into the output field, causing a parse error. The rule is now to ensure that field names in structured outputs are distinct from any attribute names in the context to prevent accidental copying.
