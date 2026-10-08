# Feature present but not invoked

A security feature was implemented and covered by unit tests, but it was never actually called in the production execution flow. The tests passed because they tested the module in isolation, not its integration. The feature was marked as 'shipped' based on code presence, but it provided no protection. The rule is now that a feature is only considered shipped if there is evidence it is being used in the live system.
