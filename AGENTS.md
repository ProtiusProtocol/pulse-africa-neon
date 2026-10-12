
- Prediction-only (off-chain) markets use `app_id` prefix `OFFCHAIN-` in the same `markets` table; on-chain lists and the trade window skip them, and `deploy-market` can later deploy the same row on-chain — one market definition, no duplicate records.
