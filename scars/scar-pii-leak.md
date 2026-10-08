# PII in Memory Record

An agent stored a contact list that included email addresses and phone numbers in a memory record. This record was later included in a prompt sent to an external LLM, leaking private information. The rule now requires all memory records to be scanned for PII and secrets before admission, blocking records that contain sensitive data.
