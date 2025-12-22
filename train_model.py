#!/usr/bin/env python3
"""
Train quality switch prediction model from telemetry data.
Outputs TensorFlow.js model for browser deployment.
"""

import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import os

# Feature extraction matching ml-telemetry.js buildFeatureVector()
def extract_features(event_data):
    """Extract 31 features from telemetry event"""
    d = event_data
    
    # Network quality mapping
    network_quality_map = {
        'Excellent': 5, 'Very Good': 4, 'Good': 3,
        'Fair': 2, 'Bad': 1, 'Very Bad': 0
    }
    
    # Device type mapping
    device_type_map = {'desktop': 2, 'tablet': 1, 'mobile': 0}
    
    # Infer device type from screen size
    screen_width = d.get('screenWidth', 0)
    if screen_width < 768:
        device_type = 0  # mobile
    elif screen_width < 1024:
        device_type = 1  # tablet
    else:
        device_type = 2  # desktop
    
    features = [
        # Network features (7)
        d.get('networkSpeed', 0),
        d.get('networkBandwidth', d.get('networkSpeed', 0)),
        d.get('rtt', 0),
        d.get('jitter', 0),
        d.get('packetLoss', 0),
        d.get('downlinkStdDev', 0),
        network_quality_map.get(d.get('networkQuality', 'Fair'), 2),
        
        # Quality change features (4)
        d.get('targetQualityIndex', 0) - d.get('originalQualityIndex', 0),  # delta
        d.get('bitrateRatio', 1.0),
        d.get('targetBitrate', 0),
        d.get('estimatedLoadTime', 0),
        
        # Buffer features (3)
        d.get('bufferedSeconds', 0),
        d.get('videoLoadPercentile', 0),
        d.get('audioLoadPercentile', 0),
        
        # Device features (4)
        d.get('devicePixelRatio', 1.0),
        (d.get('screenWidth', 0) * d.get('screenHeight', 0)) / 1e6,  # megapixels
        device_type,
        d.get('targetResolution', 0) / 1e6,
        
        # Playback features (6)
        d.get('currentTime', 0) / max(d.get('duration', 1), 1),  # progress
        d.get('droppedFrames', 0) / max(d.get('totalFrames', 1), 1),  # drop rate
        d.get('avgDecodeTime', 0),
        d.get('cvActivityScore', 0),
        d.get('playbackRate', 1.0),
        d.get('targetFps', 30),
        
        # Context features (3)
        1.0 if d.get('audioMode', False) else 0.0,
        1.0 if d.get('backgroundPlay', False) else 0.0,
        1.0 if d.get('autoRes', True) else 0.0
    ]
    
    return np.array(features, dtype=np.float32)

def load_telemetry_data(json_path):
    """Load and process telemetry JSON"""
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    features_list = []
    success_labels = []
    time_labels = []
    
    for event in data:
        event_data = event['data']
        features = extract_features(event_data)
        
        # Target: success (binary classification)
        success = 1.0 if event_data.get('success', False) else 0.0
        
        # Target: timeToPlay (regression, in seconds)
        time_to_play = event_data.get('timeToPlay', 0) / 1000.0  # ms -> seconds
        
        features_list.append(features)
        success_labels.append(success)
        time_labels.append(time_to_play)
    
    X = np.array(features_list)
    y_success = np.array(success_labels)
    y_time = np.array(time_labels)
    
    return X, y_success, y_time

def create_model(input_dim):
    """Create neural network model"""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(16, activation='relu'),
        # Two outputs: [success_probability, expected_time]
        keras.layers.Dense(2, activation='sigmoid', name='output')
    ])
    
    # Custom loss: weighted combination of classification and regression
    def combined_loss(y_true, y_pred):
        # y_true[:, 0] = success (0 or 1)
        # y_true[:, 1] = timeToPlay (seconds)
        # y_pred[:, 0] = predicted success probability
        # y_pred[:, 1] = predicted timeToPlay
        
        # Binary crossentropy for success prediction
        bce = tf.keras.losses.binary_crossentropy(y_true[:, 0], y_pred[:, 0])
        
        # MSE for time prediction
        mse = tf.reduce_mean(tf.square(y_true[:, 1] - y_pred[:, 1]))
        
        # Weighted combination
        return bce + 0.5 * mse
    
    model.compile(
        optimizer='adam',
        loss=combined_loss,
        metrics=['accuracy']
    )
    
    return model

def main():
    print("🚀 Training Quality Switch Prediction Model\n")
    
    # 1. Load data
    print("📂 Loading telemetry data...")
    telemetry_path = 'telemetry.json'
    X, y_success, y_time = load_telemetry_data(telemetry_path)
    
    print(f"   Loaded {len(X)} events")
    print(f"   Success rate: {y_success.mean():.1%}")
    print(f"   Avg switch time: {y_time.mean():.2f}s\n")
    
    if len(X) < 10:
        print("⚠️  Warning: Very few samples. Model may not generalize well.")
        print("   Collect more telemetry data (aim for 100+ events)\n")
    
    # 2. Normalize features
    print("🔧 Normalizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Save scaler parameters for deployment
    scaler_params = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist()
    }
    os.makedirs('models/quality-switch-model', exist_ok=True)
    with open('models/scaler_params.json', 'w') as f:
        json.dump(scaler_params, f)
    with open('models/quality-switch-model/scaler_params.json', 'w') as f:
        json.dump(scaler_params, f)
    
    # 3. Combine targets
    y_combined = np.column_stack([y_success, y_time])
    
    # 4. Split data
    if len(X) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_combined, test_size=0.2, random_state=42
        )
    else:
        # Too few samples, use all for training
        X_train, X_test = X_scaled, X_scaled
        y_train, y_test = y_combined, y_combined
    
    print(f"   Train: {len(X_train)}, Test: {len(X_test)}\n")
    
    # 5. Create and train model
    print("🧠 Training neural network...")
    model = create_model(input_dim=X.shape[1])
    
    history = model.fit(
        X_train, y_train,
        epochs=100,
        batch_size=min(32, len(X_train)),
        validation_data=(X_test, y_test) if len(X) >= 10 else None,
        verbose=0
    )
    
    final_loss = history.history['loss'][-1]
    final_acc = history.history['accuracy'][-1]
    print(f"   Final loss: {final_loss:.4f}, Accuracy: {final_acc:.2%}\n")
    
    # 6. Evaluate
    if len(X) >= 10:
        print("📊 Test set evaluation:")
        test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
        print(f"   Test accuracy: {test_acc:.2%}")
        print(f"   Test loss: {test_loss:.4f}\n")
    
    # 7. Export to TensorFlow.js
    print("💾 Exporting to TensorFlow.js format...")
    
    # Save as SavedModel using export (new API)
    model.export('models/temp_saved_model')
    
    # Convert to TensorFlow.js using command line
    import subprocess
    result = subprocess.run([
        'tensorflowjs_converter',
        '--input_format', 'tf_saved_model',
        '--output_format', 'tfjs_graph_model',
        'models/temp_saved_model',
        'models/quality-switch-model'
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Model saved to: models/quality-switch-model/\n")
    else:
        print("⚠️  Conversion warning (model may still work):")
        print(result.stderr)
        print("\n✅ SavedModel format saved to: models/temp_saved_model/")
        print("   Manual conversion: tensorflowjs_converter --input_format=tf_saved_model models/temp_saved_model models/quality-switch-model\n")
    print("📝 Next steps:")
    print("   1. Copy models/ folder to your web app")
    print("   2. Model will auto-load in ml-model.js")
    print("   3. Collect more data and retrain periodically")

if __name__ == '__main__':
    main()
