// ml-model.js - TensorFlow.js model for quality switching

class QualitySwitchPredictor {
  constructor() {
    this.model = null;
    this.modelUrl = '/models/quality-switch-model/model.json';
    this.scalerParams = null;
    this.scalerUrl = '/models/quality-switch-model/scaler_params.json';
    this.fallbackToHeuristics = true;
    this.minConfidence = 0.7; // Only switch if model confidence > 70%
  }

  // Load the TensorFlow.js model
  async loadModel() {
    try {
      console.log('Loading TensorFlow.js model...');
      this.model = await tf.loadGraphModel(this.modelUrl);
      
      // Load scaler parameters
      const scalerResponse = await fetch(this.scalerUrl);
      this.scalerParams = await scalerResponse.json();
      
      console.log('✅ ML model loaded successfully');
      this.fallbackToHeuristics = false;
      return true;
    } catch (error) {
      console.warn('⚠️  ML model not available, using enhanced heuristics:', error.message);
      console.log('💡 Telemetry collection continues. Train model after collecting 100+ events.');
      this.fallbackToHeuristics = true;
      return false;
    }
  }

  // Normalize features using saved scaler parameters
  normalizeFeatures(features) {
    if (!this.scalerParams) return features;
    
    const normalized = features.map((val, idx) => {
      const mean = this.scalerParams.mean[idx];
      const scale = this.scalerParams.scale[idx];
      return (val - mean) / scale;
    });
    
    return normalized;
  }

  // Predict if quality switch will be fast (< 1 sec)
  async predictSwitchSuccess(features) {
    if (this.fallbackToHeuristics || !this.model) {
      return this.heuristicPrediction(features);
    }

    try {
      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);
      
      // features is array of 27 numbers (from buildFeatureVector)
      const inputTensor = tf.tensor2d([normalizedFeatures], [1, normalizedFeatures.length]);
      const prediction = this.model.execute(inputTensor);
      const result = await prediction.data();
      inputTensor.dispose();
      prediction.dispose();

      // result[0] = probability of success
      // result[1] = expected switch time (seconds)
      return {
        shouldSwitch: result[0] > this.minConfidence,
        confidence: result[0],
        expectedSwitchTime: result[1],
        usedML: true
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return this.heuristicPrediction(features);
    }
  }

  // Fallback heuristic (improved based on telemetry analysis)
  heuristicPrediction(features) {
    // Extract key features
    const networkSpeed = features[0]; // Mbps
    const bitrateRatio = features[8]; // target/original
    const targetBitrate = features[9]; // Kbps
    const estimatedLoadTime = features[10]; // seconds
    const bufferedSeconds = features[11]; // seconds
    const qualityDelta = features[7]; // target - original index
    const droppedFrameRate = features[19]; // dropped/total
    
    // Conservative rules based on real telemetry failures:
    // 1. Never jump more than 2 quality levels at once
    if (Math.abs(qualityDelta) > 2) {
      return {
        shouldSwitch: false,
        confidence: 0.2,
        expectedSwitchTime: estimatedLoadTime,
        usedML: false,
        reason: 'Quality jump too large (max 2 levels)'
      };
    }
    
    // 2. Never upgrade if bitrate ratio > 3x
    if (bitrateRatio > 3.0 && qualityDelta > 0) {
      return {
        shouldSwitch: false,
        confidence: 0.3,
        expectedSwitchTime: estimatedLoadTime,
        usedML: false,
        reason: 'Bitrate increase too aggressive (>3x)'
      };
    }
    
    // 3. Require sufficient buffer for upgrades (downgrade more freely)
    const minBuffer = qualityDelta > 0 ? 20 : 10; // 20s for upgrade, 10s for downgrade
    if (bufferedSeconds < minBuffer) {
      return {
        shouldSwitch: false,
        confidence: 0.4,
        expectedSwitchTime: estimatedLoadTime,
        usedML: false,
        reason: `Insufficient buffer (${bufferedSeconds.toFixed(1)}s < ${minBuffer}s)`
      };
    }
    
    // 4. Network speed must support target bitrate with 2x safety margin
    const requiredSpeed = (targetBitrate / 1000) * 2; // Convert Kbps to Mbps, 2x margin
    if (networkSpeed < requiredSpeed) {
      return {
        shouldSwitch: false,
        confidence: 0.35,
        expectedSwitchTime: estimatedLoadTime,
        usedML: false,
        reason: `Network too slow (${networkSpeed.toFixed(1)} < ${requiredSpeed.toFixed(1)} Mbps)`
      };
    }
    
    // 5. Don't upgrade if already dropping frames
    if (droppedFrameRate > 0.05 && qualityDelta > 0) { // >5% drop rate
      return {
        shouldSwitch: false,
        confidence: 0.25,
        expectedSwitchTime: estimatedLoadTime,
        usedML: false,
        reason: 'Already dropping frames'
      };
    }
    
    // 6. Estimate switch time conservatively
    const conservativeEstimate = Math.max(estimatedLoadTime * 1.5, 0.3); // 1.5x buffer, min 300ms
    if (conservativeEstimate > 2.5 && qualityDelta > 0) { // Don't upgrade if >2.5s expected
      return {
        shouldSwitch: false,
        confidence: 0.5,
        expectedSwitchTime: conservativeEstimate,
        usedML: false,
        reason: `Switch time too long (${conservativeEstimate.toFixed(1)}s)`
      };
    }
    
    // All checks passed - approve switch
    return {
      shouldSwitch: true,
      confidence: 0.7,
      expectedSwitchTime: conservativeEstimate,
      usedML: false,
      reason: 'Heuristic checks passed'
    };
  }

  // Recommend best quality index from candidates
  async recommendQuality(candidates) {
    if (this.fallbackToHeuristics || !this.model) {
      return this.heuristicRecommendation(candidates);
    }

    try {
      const predictions = [];
      for (const candidate of candidates) {
        const features = window.videoQualityTelemetry.buildFeatureVector(candidate);
        const pred = await this.predictSwitchSuccess(features);
        predictions.push({
          qualityIndex: candidate.targetQualityIndex,
          score: pred.confidence,
          expectedTime: pred.expectedSwitchTime
        });
      }

      // Pick highest confidence that meets threshold
      predictions.sort((a, b) => b.score - a.score);
      const best = predictions.find(p => p.score > this.minConfidence);
      return best ? best.qualityIndex : null;
    } catch (error) {
      console.error('Recommendation error:', error);
      return this.heuristicRecommendation(candidates);
    }
  }

  heuristicRecommendation(candidates) {
    // Your current getOptimalQuality logic here
    return null; // fallback to existing code
  }
}

// Global instance
window.qualitySwitchPredictor = new QualitySwitchPredictor();

// Load model when script loads (DOM is already ready since script is at bottom)
window.qualitySwitchPredictor.loadModel();