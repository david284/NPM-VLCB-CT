# NPM-MERGLCB-CT

# Installation:

# Execution:

# Test cases
The aim is to exercise all combinations of parameters for supported opcodes. Boundary values are used for efficient test cases (see Boundary Value Analysis below).


# Boundary Value Analysis
Boundary Value Analysis (or Boundary testing) is based on testing the boundary values of valid and invalid partitions (closely related to equivalence partitioning). The behavior at the boundary of each partion is more likely to be incorrect than the behavior within the partion, so boundaries are an area where testing is likely to yield defects.
For example, a byte variable with a valid range of 0 to 100 (and, by implication, an invalid range of 101 to 255), would have boundary test values of 0, 100, 101 and 255, where 0 and 100 would have a valid result, and 101 and 255 would have an invalid result (whatever that means in that context). An extra test case worth adding would be a single bit - see single bit test case below

# Single bit test case
Where the test value requires programatic ordering, e.g. where the value is a less than a whole byte, or occupies multiple bytes, then setting just one bit will validate the ordering & placement of the value. Adding a one bit test to every set of test cases ensures this is never neglected, even if it's strictly not required in some cases.
