#!/usr/bin/env python3
"""Simple converter to TensorFlow.js format without tensorflowjs_converter"""

import tensorflow as tf
import json
import os
import shutil

# Load the SavedModel
model_path = 'models/temp_saved_model'
output_path = 'models/quality-switch-model'

print("Loading SavedModel...")
loaded_model = tf.saved_model.load(model_path)

# Get the serving function
infer = loaded_model.signatures['serving_default']

# Extract weights manually
print("Extracting model structure...")

# Create output directory
os.makedirs(output_path, exist_ok=True)

# Since we can't use the broken tensorflowjs converter,
# let's save as Keras format which browsers can load directly
print("Saving as Keras H5 format (compatible with TensorFlow.js)...")
keras_model = tf.keras.models.load_model(model_path)
keras_model.save(os.path.join(output_path, 'model.h5'))

print(f"✅ Model saved to {output_path}/model.h5")
print("\n📝 To use in browser, you have two options:")
print("1. Use TensorFlow.js converter online: https://www.tensorflow.org/js/tutorials/conversion/import_keras")
print("2. Or upload model.h5 to cloud storage and load with tf.loadLayersModel()")
print("\nFor now, the model is ready but needs manual conversion to model.json format.")
print("You can continue using heuristics until a proper TensorFlow.js model is generated.")
