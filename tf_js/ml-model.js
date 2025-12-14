// ml-model.js - TensorFlow.js model for quality switching

class QualitySwitchPredictor {
  constructor() {
    this.model = null;
    this.modelUrl = '/models/quality-switch-model/model.json';
    this.fallbackToHeuristics = true;
    this.minConfidence = 0.7; // Only switch if model confidence > 70%
  }

  // Load the TensorFlow.js model
  async loadModel() {
    try {
      console.log('Loading TensorFlow.js model...');
      this.model = await tf.loadLayersModel(this.modelUrl);
      console.log('Model loaded successfully');
      this.fallbackToHeuristics = false;
      return true;
    } catch (error) {
      console.warn('Failed to load ML model, using heuristics:', error);
      this.fallbackToHeuristics = true;
      return false;
    }
  }

  // Predict if quality switch will be fast (< 1 sec)
  async predictSwitchSuccess(features) {
    if (this.fallbackToHeuristics || !this.model) {
      return this.heuristicPrediction(features);
    }

    try {
      // features is array of 31 numbers (from buildFeatureVector)
      const inputTensor = tf.tensor2d([features], [1, features.length]);
      const prediction = this.model.predict(inputTensor);
      const result = await prediction.data();
      inputTensor.dispose();
      prediction.dispose();

      // result[0] = probability of fast switch
      // result[1] = expected switch time (if regression model)
      return {
        shouldSwitch: result[0] > this.minConfidence,
        confidence: result[0],
        expectedSwitchTime: result[1] || null,
        usedML: true
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return this.heuristicPrediction(features);
    }
  }

  // Fallback heuristic (your current logic)
  heuristicPrediction(features) {
    const networkSpeed = features[0];
    const estimatedLoadTime = features[10];
    const bufferedSeconds = features[11];
    const bitrateRatio = features[8];

    const shouldSwitch = (
      networkSpeed > 2.0 && // > 2 Mbps
      estimatedLoadTime < 1.0 && // < 1 second
      bufferedSeconds > 5 && // > 5 seconds buffer
      bitrateRatio < 2.0 // not upgrading more than 2x
    );

    return {
      shouldSwitch: shouldSwitch,
      confidence: shouldSwitch ? 0.6 : 0.4,
      expectedSwitchTime: estimatedLoadTime,
      usedML: false
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