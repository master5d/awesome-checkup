# Empty window reads as calm

A monitoring dashboard showed a flat line for a metric, indicating stability. The metric was calculated over an empty data window, resulting in a variance of zero. The system was actually in a state of no data, not stability. The rule is now to return null for aggregates over empty windows to signal a lack of data rather than false stability.
