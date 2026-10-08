# Infrastructure token reused as inference key

A broad infrastructure token was reused for an inference API because it 'already had access'. This exposed the entire account (DNS, databases) to the same risk as the inference endpoint. The rule is to use narrowly scoped tokens for inference, verified by attempting to access unrelated resources and expecting a 403.
