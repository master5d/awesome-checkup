# Agent Guess Stored as Owner Word

An agent summarized a conversation and stored a guess about the owner's preference as a direct quote from the owner. The record was marked with the owner's origin. In a later session, the agent acted on this 'owner instruction' without verification, causing a workflow error. The rule now requires explicit markers in the text to distinguish owner words from agent assertions, and blocks records where agent guesses are marked as owner claims.
