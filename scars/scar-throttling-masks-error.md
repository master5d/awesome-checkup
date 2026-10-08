# 429 errors masked permanent content deletion

A batch of video downloads failed with 429 errors. The operator assumed it was rate limiting and waited. After the limit reset, the downloads still failed because the videos had been deleted from the source. The initial 429 masked the true cause (404/410). The rule is now to resolve throttling before diagnosing root causes, as temporary errors can hide permanent ones.
