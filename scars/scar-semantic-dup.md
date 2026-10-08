# Semantic Duplicate Confusion

Two records contained the same lesson but phrased differently. The agent retrieved both, leading to conflicting advice in the response. The lexical duplicate detector missed them because the words were different. The rule now includes a semantic duplicate check using vector similarity to flag records that are likely duplicates, allowing the owner to merge or clarify them.
