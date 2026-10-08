# Missing data displayed as zero cost

A cost calculator displayed a machine's cost as zero because the price field was empty. This made the most expensive machine appear the most profitable. The zero was not a measurement but a missing value. The rule is now to distinguish between 'measured zero' and 'missing data', displaying the latter as null or an error state, not zero.
