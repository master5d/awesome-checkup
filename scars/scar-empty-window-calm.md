# Empty data read as stability

A monitoring metric calculated the variance of a signal over a time window. When the window contained no data points, the calculation returned zero. The consumer interpreted this zero variance as 'stable' or 'calm' and took no action. In reality, the system was not generating any data, which was a critical failure. The rule is now that aggregates must return null or an explicit 'insufficient data' state when the window is empty.
