# Quality Switch ML Model

This directory contains the trained TensorFlow.js model for predicting quality switch success.

## Files
- `model.json` - Model architecture and weights manifest
- `group1-shard*` - Model weight files
- `scaler_params.json` - Feature normalization parameters

## Training
Run `python train_model.py` to retrain with latest telemetry data.

## Usage
Model is automatically loaded by `tf_js/ml-model.js` on page load.
