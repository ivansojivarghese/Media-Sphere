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

## Training on Colab

### 1. Upload Telemetry Data

- Open the `MediaSphere_QualitySwitchModelling.ipynb` notebook on Colab.
- Upload `train_model.py` and `telemetry.json` files.

### 2. Run Cells

- Execute the cells in the notebook to install dependencies and train the model.

```python
# Cell 1: Install dependencies
!pip install tensorflowjs
!tensorflowjs_converter --input_format tf_saved_model temp_saved_model quality-switch-model

!pip install tensorflow scikit-learn tensorflowjs
```

```python
# Cell 2: Train the model
!python train_model.py
```

```python
# Cell 3: Verify 21 inputs
import json
with open('models/quality-switch-model/model.json', 'r') as f:
    model_info = json.load(f)
input_shape = model_info['signature']['inputs']['keras_tensor']['tensorShape']['dim']
print(f"Input shape: {input_shape}")  # Should show [{"size": "-1"}, {"size": "21"}]
```

### 3. Download Model Files

- After training, download the files inside `models/quality-switch-model/` directory locally.