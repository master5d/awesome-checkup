# FAIL printed, exit code 0

A check printed FAIL and the job still went green. The test command was piped into `tail` to keep logs short, and the shell reported the exit code of `tail`, not of the tests. The same pattern hid behind `|| true` added "temporarily". It became the most common silent failure we found. Now test commands are never piped without `pipefail`, and "failed to run" is reported separately from "passed".
