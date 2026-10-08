# LLM judge variance masked model performance

An ablation study used a pool alias as the LLM judge. The pool balanced requests across four different models. The score for the same input varied significantly between runs (0.933 to 0.883) because the judge model changed. This made it impossible to determine if performance changes were due to the model under test or the judge. The rule is now to pin the judge to a single, stable model instance and exclude it from fallbacks.
