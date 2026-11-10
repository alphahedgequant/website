// Original beginner-friendly Learn extension, modules 4–6. Examples are hypothetical educational illustrations.
export const MORE_TOPICS_2=[
  {
    "id": "quant-topic-4-14",
    "module": 3,
    "index": 14,
    "title": "What is a dataset row?",
    "concept": "A row represents one observation; columns describe variables recorded for it. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "One daily row might include date, close, volume and next-day return.",
    "caution": "A row should not contain information published only after its timestamp.",
    "connection": "This expands the Data Science & ML I course with what is a dataset row?. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-15",
    "module": 3,
    "index": 15,
    "title": "Feature versus target",
    "concept": "A feature is information available before a prediction; a target is what happens afterward. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Today's volume can be a feature for tomorrow's return label.",
    "caution": "Using future targets as features creates look-ahead leakage.",
    "connection": "This expands the Data Science & ML I course with feature versus target. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-16",
    "module": 3,
    "index": 16,
    "title": "Missing values",
    "concept": "Missing measurements must be treated explicitly rather than silently invented. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A blank holiday volume should not automatically become a zero-volume trading day.",
    "caution": "Filling a gap with a future average leaks later information.",
    "connection": "This expands the Data Science & ML I course with missing values. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-17",
    "module": 3,
    "index": 17,
    "title": "Outliers and data errors",
    "concept": "An unusual value may be a real event or a broken data feed. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A price jumping tenfold may be a corporate action or an incorrect print.",
    "caution": "Deleting every extreme value can erase the very risk being studied.",
    "connection": "This expands the Data Science & ML I course with outliers and data errors. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-18",
    "module": 3,
    "index": 18,
    "title": "Corporate-action adjustments",
    "concept": "Historical price series must treat splits and dividends according to the research question. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A two-for-one split should not appear as a 50% trading loss.",
    "caution": "Raw and total-return price series answer different questions.",
    "connection": "This expands the Data Science & ML I course with corporate-action adjustments. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-19",
    "module": 3,
    "index": 19,
    "title": "Time-based data splits",
    "concept": "Financial models should generally learn from earlier observations and be judged on later ones. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Train through 2023 and evaluate on untouched 2024 observations.",
    "caution": "Random shuffling may let future market regimes influence training.",
    "connection": "This expands the Data Science & ML I course with time-based data splits. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-20",
    "module": 3,
    "index": 20,
    "title": "Data leakage by preprocessing",
    "concept": "Even a harmless-looking scaling step can reveal properties of the test period. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Computing a global mean using the entire history tells training about later observations.",
    "caution": "Fit scalers and imputers only with the training portion.",
    "connection": "This expands the Data Science & ML I course with data leakage by preprocessing. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-21",
    "module": 3,
    "index": 21,
    "title": "Standardization and normalization",
    "concept": "Scaling puts measurements with different units on comparable numerical ranges. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A volume measured in millions can dominate a price-change variable near 0.01.",
    "caution": "Scaling must not confuse improved numerical conditioning with predictive power.",
    "connection": "This expands the Data Science & ML I course with standardization and normalization. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-22",
    "module": 3,
    "index": 22,
    "title": "Categorical encoding",
    "concept": "Categories such as sectors or weekdays need machine-readable representations. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Banking, energy and software can be one-hot encoded as separate flags.",
    "caution": "Assigning numbers 1, 2 and 3 can introduce a false ranking.",
    "connection": "This expands the Data Science & ML I course with categorical encoding. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-23",
    "module": 3,
    "index": 23,
    "title": "Class imbalance",
    "concept": "Rare targets make accuracy alone misleading. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A fraud model predicting 'no fraud' always may be 99% accurate but useless.",
    "caution": "Compare precision, recall and costs of false alarms.",
    "connection": "This expands the Data Science & ML I course with class imbalance. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-24",
    "module": 3,
    "index": 24,
    "title": "Confusion matrices",
    "concept": "A confusion matrix counts correct and incorrect positive and negative predictions. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Ten true positives and five false positives show a trade-off hidden by total accuracy.",
    "caution": "Thresholds and class definitions affect the counts.",
    "connection": "This expands the Data Science & ML I course with confusion matrices. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-25",
    "module": 3,
    "index": 25,
    "title": "Precision and recall",
    "concept": "Precision asks how often flagged cases are correct; recall asks how many real cases were caught. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A crash warning tool can have high precision but miss most actual crashes.",
    "caution": "Neither measure describes profit after implementing a trade.",
    "connection": "This expands the Data Science & ML I course with precision and recall. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-26",
    "module": 3,
    "index": 26,
    "title": "Regression residuals",
    "concept": "Residuals are prediction errors, and their pattern can reveal a model flaw. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A forecast of 5 with an actual value of 7 leaves a residual of +2.",
    "caution": "Consistent residual patterns suggest omitted features or changing regimes.",
    "connection": "This expands the Data Science & ML I course with regression residuals. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-27",
    "module": 3,
    "index": 27,
    "title": "MAE versus RMSE",
    "concept": "Both measure prediction errors, but RMSE penalizes large mistakes more strongly. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Errors of 1 and 5 produce MAE 3 and RMSE about 3.61.",
    "caution": "Pick the metric based on the real cost of errors, not convenience.",
    "connection": "This expands the Data Science & ML I course with mae versus rmse. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-28",
    "module": 3,
    "index": 28,
    "title": "Overfitting and underfitting",
    "concept": "Overfitting remembers noise; underfitting misses useful structure. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A 50-parameter model fitted to 60 observations may be unstable.",
    "caution": "More complex models are not automatically more accurate on future data.",
    "connection": "This expands the Data Science & ML I course with overfitting and underfitting. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-29",
    "module": 3,
    "index": 29,
    "title": "Regularization strength",
    "concept": "Regularization discourages very large or numerous coefficients to improve generalization. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Ridge regression may reduce the influence of a noisy indicator.",
    "caution": "Too much penalty can remove a genuine explanatory signal.",
    "connection": "This expands the Data Science & ML I course with regularization strength. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-30",
    "module": 3,
    "index": 30,
    "title": "Cross-validation for time series",
    "concept": "Time-based validation repeats training on earlier windows and testing later windows. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Fit on January–March, validate April, then extend training through April for May.",
    "caution": "Financial targets that overlap in time need leakage-aware gaps.",
    "connection": "This expands the Data Science & ML I course with cross-validation for time series. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-31",
    "module": 3,
    "index": 31,
    "title": "Baseline models",
    "concept": "A simple baseline provides a minimum standard for judging a complex system. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Compare a return forecast against predicting zero return every day.",
    "caution": "A complex model winning on training data alone is not evidence of value.",
    "connection": "This expands the Data Science & ML I course with baseline models. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-32",
    "module": 3,
    "index": 32,
    "title": "Data-version tracking",
    "concept": "Saving data versions makes a result reproducible when a vendor later revises history. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A backtest should record which corporate-action adjustment file it used.",
    "caution": "A code commit cannot reproduce results if the underlying data changes silently.",
    "connection": "This expands the Data Science & ML I course with data-version tracking. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-4-33",
    "module": 3,
    "index": 33,
    "title": "Prediction calibration",
    "concept": "Calibration checks whether predicted probabilities match observed frequencies. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Among events assigned 70% probability, roughly 70% should occur over a suitable sample.",
    "caution": "Probabilities can be calibrated yet too weak to beat trading costs.",
    "connection": "This expands the Data Science & ML I course with prediction calibration. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-16",
    "module": 4,
    "index": 16,
    "title": "Neural-network inputs",
    "concept": "Neural networks transform numerical inputs through layers of adjustable weights. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A network might consume lagged returns, volume ratios and rate changes.",
    "caution": "More input features can increase noise and leakage risk.",
    "connection": "This expands the Data Science & ML II course with neural-network inputs. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-17",
    "module": 4,
    "index": 17,
    "title": "Activation functions",
    "concept": "An activation function allows a neural network to represent non-linear relationships. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A ReLU unit outputs zero for negative inputs and leaves positive inputs unchanged.",
    "caution": "Saturated or poorly chosen activations can make training difficult.",
    "connection": "This expands the Data Science & ML II course with activation functions. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-18",
    "module": 4,
    "index": 18,
    "title": "Gradient descent",
    "concept": "Gradient descent adjusts model parameters to reduce a loss on training examples. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A model changes a weight slightly in the direction that lowers squared forecast error.",
    "caution": "Small training loss does not establish useful future predictions.",
    "connection": "This expands the Data Science & ML II course with gradient descent. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-19",
    "module": 4,
    "index": 19,
    "title": "Learning rate and batches",
    "concept": "Learning rate controls update size; a batch is the group of examples used for an update. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A very large learning rate can make training loss jump instead of falling.",
    "caution": "A small learning rate can be slow and still reach a poor solution.",
    "connection": "This expands the Data Science & ML II course with learning rate and batches. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-20",
    "module": 4,
    "index": 20,
    "title": "Dropout and regularization",
    "concept": "Dropout temporarily removes some network units during training to reduce dependence on particular paths. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A network with dropout may fit training data less perfectly but behave better on unseen data.",
    "caution": "Dropout is not a cure for leakage or regime changes.",
    "connection": "This expands the Data Science & ML II course with dropout and regularization. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-21",
    "module": 4,
    "index": 21,
    "title": "Early stopping",
    "concept": "Early stopping ends training when validation performance stops improving. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Stop after validation error worsens for several epochs even while training error falls.",
    "caution": "Repeatedly tuning on the validation set can overfit that set.",
    "connection": "This expands the Data Science & ML II course with early stopping. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-22",
    "module": 4,
    "index": 22,
    "title": "Embedding representations",
    "concept": "Embeddings turn categories or words into learned vectors that capture useful similarity. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A model can represent company descriptions as numerical vectors for search.",
    "caution": "An embedding captures statistical patterns, not verified financial meaning.",
    "connection": "This expands the Data Science & ML II course with embedding representations. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-23",
    "module": 4,
    "index": 23,
    "title": "Attention and transformers",
    "concept": "Attention lets a model weight different parts of an input sequence. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A news model may attend to the date, company and guidance change in an earnings note.",
    "caution": "Attention weights are not a proof of causal explanation.",
    "connection": "This expands the Data Science & ML II course with attention and transformers. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-24",
    "module": 4,
    "index": 24,
    "title": "Tokenization of financial text",
    "concept": "Tokenization splits text into pieces a language model can process. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A ticker, percentage and currency symbol may be broken into several tokens.",
    "caution": "Different tokenizers can distort numeric notation and rare company names.",
    "connection": "This expands the Data Science & ML II course with tokenization of financial text. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-25",
    "module": 4,
    "index": 25,
    "title": "Entity extraction",
    "concept": "Entity extraction identifies companies, people, dates and quantities in text. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A filing parser can extract a company name and a revenue number with its unit.",
    "caution": "Named entities may be confused across subsidiaries or similarly named firms.",
    "connection": "This expands the Data Science & ML II course with entity extraction. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-26",
    "module": 4,
    "index": 26,
    "title": "Sentiment versus factual events",
    "concept": "Sentiment describes tone; a factual event records what changed. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A negative news headline and an actual debt covenant breach are different inputs.",
    "caution": "Positive words do not guarantee positive future stock returns.",
    "connection": "This expands the Data Science & ML II course with sentiment versus factual events. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-27",
    "module": 4,
    "index": 27,
    "title": "Forecasting with sequence models",
    "concept": "Sequence models use observations in order to represent time patterns. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A model might read the last 20 daily observations before predicting tomorrow's volatility.",
    "caution": "A sequence model cannot use data posted after the forecast cutoff.",
    "connection": "This expands the Data Science & ML II course with forecasting with sequence models. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-28",
    "module": 4,
    "index": 28,
    "title": "Regime clustering",
    "concept": "Clustering groups observations with similar features without a known target label. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Days with high volume and volatility may form one descriptive regime.",
    "caution": "Cluster labels such as 'crisis' are human interpretations, not discovered truths.",
    "connection": "This expands the Data Science & ML II course with regime clustering. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-29",
    "module": 4,
    "index": 29,
    "title": "Autoencoder anomalies",
    "concept": "An autoencoder learns to reconstruct common patterns; unusual reconstruction errors may flag anomalies. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A large reconstruction error in a market-data row can trigger a review.",
    "caution": "An unusual market event may be real, not a faulty observation.",
    "connection": "This expands the Data Science & ML II course with autoencoder anomalies. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-30",
    "module": 4,
    "index": 30,
    "title": "Reinforcement-learning rewards",
    "concept": "A reinforcement agent learns from rewards linked to actions and states. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A trading simulation might reward net P&L but penalize excess inventory.",
    "caution": "Poor reward design can encourage unrealistic or unsafe actions.",
    "connection": "This expands the Data Science & ML II course with reinforcement-learning rewards. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-31",
    "module": 4,
    "index": 31,
    "title": "Offline versus online learning",
    "concept": "Offline models train on stored history; online systems update from incoming events. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A daily retrained model differs from one that updates every tick.",
    "caution": "Online changes need monitoring, bounded behavior and reproducibility.",
    "connection": "This expands the Data Science & ML II course with offline versus online learning. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-32",
    "module": 4,
    "index": 32,
    "title": "Concept drift detection",
    "concept": "Concept drift occurs when the relationship between features and targets changes. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A volume signal useful before a market rule change may cease to predict anything.",
    "caution": "An alarm may reflect broken input data rather than true economic change.",
    "connection": "This expands the Data Science & ML II course with concept drift detection. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-33",
    "module": 4,
    "index": 33,
    "title": "Model ensembles",
    "concept": "Combining models can reduce dependence on one method when their errors differ. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Average forecasts from a linear model and a tree model to compare with either alone.",
    "caution": "Models trained on the same leaked data can share the same failure.",
    "connection": "This expands the Data Science & ML II course with model ensembles. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-34",
    "module": 4,
    "index": 34,
    "title": "Explainability and feature importance",
    "concept": "Feature importance offers clues about which inputs a model uses. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Permutation tests may show that volume contributes more than weekday labels.",
    "caution": "Importance is not necessarily causal and can mislead with correlated features.",
    "connection": "This expands the Data Science & ML II course with explainability and feature importance. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-5-35",
    "module": 4,
    "index": 35,
    "title": "Model deployment and rollback",
    "concept": "A production model needs version control, monitoring and a safe fallback. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Keep the earlier validated model available if a new deployment produces abnormal orders.",
    "caution": "A successful build is not evidence that market execution is correct.",
    "connection": "This expands the Data Science & ML II course with model deployment and rollback. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-15",
    "module": 5,
    "index": 15,
    "title": "Bond settlement and accrued interest",
    "concept": "A bond trade price may exclude interest earned since the last coupon; settlement adjusts for it. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A clean quote of ₹100 plus ₹1 accrued interest produces ₹101 dirty settlement price.",
    "caution": "Day-count conventions and holidays change the exact accrued amount.",
    "connection": "This expands the Fixed Income & Credit course with bond settlement and accrued interest. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-16",
    "module": 5,
    "index": 16,
    "title": "Zero-coupon bonds",
    "concept": "A zero-coupon bond pays its face amount at maturity rather than periodic coupons. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "₹110 promised next year is worth ₹100 if the required annual yield is 10%.",
    "caution": "This discounting ignores default and liquidity unless modeled separately.",
    "connection": "This expands the Fixed Income & Credit course with zero-coupon bonds. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-17",
    "module": 5,
    "index": 17,
    "title": "Bootstrapping spot curves",
    "concept": "A spot curve assigns discount rates to individual future payment dates. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A two-year coupon bond can help infer a two-year discount factor after shorter cash flows are valued.",
    "caution": "Incorrect conventions or illiquid quotes create unstable curves.",
    "connection": "This expands the Fixed Income & Credit course with bootstrapping spot curves. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-18",
    "module": 5,
    "index": 18,
    "title": "Forward interest rates",
    "concept": "A forward rate is a rate implied or agreed today for a future period. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "One-year and two-year discount factors can imply the rate between years one and two.",
    "caution": "An implied forward is not a certain future central-bank policy rate.",
    "connection": "This expands the Fixed Income & Credit course with forward interest rates. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-19",
    "module": 5,
    "index": 19,
    "title": "Term premium",
    "concept": "A long bond yield can include compensation for holding maturity risk. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A ten-year government yield may exceed the average expected short-term rate.",
    "caution": "The term premium cannot be directly observed without model assumptions.",
    "connection": "This expands the Fixed Income & Credit course with term premium. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-20",
    "module": 5,
    "index": 20,
    "title": "Real yields and inflation",
    "concept": "A nominal yield combines purchasing-power growth with inflation effects. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A 7% nominal yield and 5% expected inflation imply roughly 2% real yield.",
    "caution": "The approximation becomes inaccurate with large rates or uncertain inflation.",
    "connection": "This expands the Fixed Income & Credit course with real yields and inflation. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-21",
    "module": 5,
    "index": 21,
    "title": "Floating-rate coupons",
    "concept": "A floating-rate bond periodically resets its coupon using a benchmark plus spread. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A benchmark of 6% and contractual spread of 1.5% gives a 7.5% coupon rate for that reset.",
    "caution": "Reset frequency and floors change effective interest-rate risk.",
    "connection": "This expands the Fixed Income & Credit course with floating-rate coupons. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-22",
    "module": 5,
    "index": 22,
    "title": "Key-rate duration",
    "concept": "Key-rate duration separates exposure to specific maturities on the yield curve. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A bond portfolio can be more sensitive to five-year rates than to one-year rates.",
    "caution": "Shifting the entire curve in parallel misses twists and steepening.",
    "connection": "This expands the Fixed Income & Credit course with key-rate duration. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-23",
    "module": 5,
    "index": 23,
    "title": "Callable bond risk",
    "concept": "A callable issuer can redeem a bond early under stated terms, altering expected cash flows. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "An issuer may refinance an expensive coupon if market yields fall.",
    "caution": "Investors may not benefit fully from falling yields because the bond can be called.",
    "connection": "This expands the Fixed Income & Credit course with callable bond risk. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-24",
    "module": 5,
    "index": 24,
    "title": "Puttable bonds",
    "concept": "A puttable bond may give the investor a contractual right to return the bond early. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A holder facing rising rates might exercise a put at a specified date and price.",
    "caution": "Contract exercise windows and creditworthiness determine practical protection.",
    "connection": "This expands the Fixed Income & Credit course with puttable bonds. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-25",
    "module": 5,
    "index": 25,
    "title": "Credit spreads and ratings",
    "concept": "Credit spreads add compensation for credit, liquidity and other risks above a chosen benchmark. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A corporate yield of 8% versus a comparable government yield of 6% has a 2-point spread.",
    "caution": "A spread is not an observed default probability and the benchmarks must match.",
    "connection": "This expands the Fixed Income & Credit course with credit spreads and ratings. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-26",
    "module": 5,
    "index": 26,
    "title": "Probability of default",
    "concept": "Default probability describes how likely nonpayment is over a stated horizon in a model. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A 2% one-year default estimate concerns frequency, not the loss size if default occurs.",
    "caution": "Historical default rates may not apply to the current issuer or regime.",
    "connection": "This expands the Fixed Income & Credit course with probability of default. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-27",
    "module": 5,
    "index": 27,
    "title": "Loss given default",
    "concept": "LGD is the share of an exposure not recovered after a default. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A lender exposed to ₹100 recovering ₹40 has 60% loss given default.",
    "caution": "Recovery timing, seniority and legal process add uncertainty.",
    "connection": "This expands the Fixed Income & Credit course with loss given default. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-28",
    "module": 5,
    "index": 28,
    "title": "Expected credit loss",
    "concept": "Expected credit loss combines default likelihood, severity and exposure into a rough expected amount. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "2% default probability times 60% LGD times ₹1,000 exposure gives ₹12.",
    "caution": "Correlated defaults and future exposure changes make portfolio modeling harder.",
    "connection": "This expands the Fixed Income & Credit course with expected credit loss. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-29",
    "module": 5,
    "index": 29,
    "title": "Credit migration matrices",
    "concept": "A migration matrix estimates movement between rating categories over time. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "An A-rated issuer can remain A, upgrade, downgrade or default over one year.",
    "caution": "Transition rates estimated from calm years may understate crisis downgrades.",
    "connection": "This expands the Fixed Income & Credit course with credit migration matrices. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-30",
    "module": 5,
    "index": 30,
    "title": "Seniority and recovery",
    "concept": "Senior creditors generally have different claims from subordinated creditors after default. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Two bonds issued by the same company can trade at different spreads because recovery differs.",
    "caution": "Legal jurisdiction, collateral and restructuring terms matter.",
    "connection": "This expands the Fixed Income & Credit course with seniority and recovery. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-31",
    "module": 5,
    "index": 31,
    "title": "Collateral haircuts",
    "concept": "A haircut reduces eligible collateral value for lending purposes to allow for price risk. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A ₹100 security with a 10% haircut supports ₹90 of collateral value.",
    "caution": "Haircuts can increase sharply when collateral becomes illiquid.",
    "connection": "This expands the Fixed Income & Credit course with collateral haircuts. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-32",
    "module": 5,
    "index": 32,
    "title": "Counterparty exposure profiles",
    "concept": "Derivative exposure changes with market prices and contract maturity. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "An interest-rate swap can move from near-zero mark-to-market to a large receivable after rates shift.",
    "caution": "Netting, collateral and wrong-way risk change potential loss.",
    "connection": "This expands the Fixed Income & Credit course with counterparty exposure profiles. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-33",
    "module": 5,
    "index": 33,
    "title": "Credit spread duration",
    "concept": "Credit spread duration approximates how a bond price changes when its credit spread moves. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "A bond with spread duration 4 may lose about 4% if its spread widens 100 basis points, locally.",
    "caution": "Rate changes and credit changes can happen at the same time.",
    "connection": "This expands the Fixed Income & Credit course with credit spread duration. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  },
  {
    "id": "quant-topic-6-34",
    "module": 5,
    "index": 34,
    "title": "Default correlation stress",
    "concept": "Credit losses can cluster because borrowers face the same shock. The goal is to understand the idea, identify the input data, and then decide where the method helps.",
    "example": "Several builders may default together after a property downturn.",
    "caution": "Ordinary correlation from few defaults may hide strong tail dependence.",
    "connection": "This expands the Fixed Income & Credit course with default correlation stress. Check how the example connects to earlier chapters, then explain in your own words where this method can fail."
  }
];
