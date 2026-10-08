# Test suite uses live credentials

A test suite loaded real configuration files and sent actual notifications using production secrets. This caused spam and consumed API quotas. The rule is to isolate or mock the source of live credentials in tests to prevent real external actions.
