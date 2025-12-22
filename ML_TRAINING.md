# ML Model Training Guide

## Overview
Train a neural network to predict quality switch success based on your collected telemetry data.

## Prerequisites
- Python 3.8+
- Telemetry data in `telemetry.json`

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download telemetry data from Neon DB:**
   - Export as JSON from Neon console, or
   - Use the GET endpoint: `curl https://rest-server-psi.vercel.app/api/telemetry > telemetry.json`

## Training

```bash
python train_model.py
```

**What it does:**
- Extracts 31 features from each telemetry event
- Trains a neural network with 2 outputs:
  - Success probability (0-1)
  - Expected switch time (seconds)
- Normalizes features for better convergence
- Exports to TensorFlow.js format in `models/`

**Output:**
```
models/
├── quality-switch-model/
│   ├── model.json          # Model architecture
│   ├── group1-shard1of1.bin # Weights
└── scaler_params.json      # Feature normalization
```

## Deployment

1. **Copy the models folder to your web server:**
   ```bash
   # If using Vercel/static hosting
   cp -r models/ public/models/
   ```

2. **Verify paths in ml-model.js:**
   - `modelUrl: '/models/quality-switch-model/model.json'`
   - `scalerUrl: '/models/scaler_params.json'`

3. **Model auto-loads on page load** (see `index.html` or `script.js`)

## Monitoring

Check browser console for:
- ✅ "Model loaded successfully" - ML predictions enabled
- ⚠️ "Failed to load ML model" - Falls back to heuristics

In `script.js`, look for:
```javascript
console.log('ML Prediction:', prediction);
// prediction.usedML === true means model is working
```

## Retraining

**When to retrain:**
- After collecting 50+ new events
- When success rate changes significantly
- After app/network changes

**How often:**
- Weekly with active users
- Monthly for stable deployments

**Steps:**
1. Export fresh telemetry: `curl ... > telemetry.json`
2. Run `python train_model.py`
3. Redeploy models folder

## Troubleshooting

**"Model path not found"**
- Check model URL in `ml-model.js`
- Verify `models/` is publicly accessible
- Try absolute path: `https://yourdomain.com/models/...`

**"Very few samples" warning**
- Need 100+ events for good generalization
- Current model will overfit
- Keep collecting data

**High error rate**
- Check feature extraction matches between Python and JS
- Verify scaler_params.json is loaded
- Review console for prediction errors

## Feature Vector (31 dimensions)

```
[0-6]   Network: speed, bandwidth, rtt, jitter, loss, stddev, quality
[7-10]  Quality: delta, ratio, target bitrate, estimated time
[11-13] Buffer: seconds, video %, audio %
[14-17] Device: DPR, screen megapixels, type, target resolution
[18-23] Playback: progress, drop rate, decode time, CV score, rate, fps
[24-26] Context: audio mode, background, auto-res
```

## Model Architecture

```
Input (31) → Dense(64, relu) → Dropout(0.3)
           → Dense(32, relu) → Dropout(0.2)
           → Dense(16, relu)
           → Dense(2, sigmoid) → [success_prob, expected_time]
```

Loss: Binary crossentropy + MSE (weighted 1.0 + 0.5)

## Next Steps

1. **Collect baseline data:** Run app for a week, gather diverse scenarios
2. **Train initial model:** `python train_model.py`
3. **Deploy and monitor:** Check `usedML: true` in logs
4. **Iterate:** Retrain monthly with new data
5. **A/B test:** Compare ML vs heuristic performance
