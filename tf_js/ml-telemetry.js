// ml-telemetry.js - Telemetry collection for ML training

class VideoQualityTelemetry {
  constructor() {
    this.events = [];
    this.currentSwitch = null;
    this.maxBatchSize = 50;
    // this.uploadEndpoint = '/api/telemetry'; // Your backend endpoint
    this.uploadEndpoint = 'https://rest-server-psi.vercel.app/api/telemetry'; // Your backend endpoint
  }

  // Start tracking a quality switch
  startQualitySwitch(data) {
    this.currentSwitch = {
      // Identifiers
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      
      // Original state
      originalQualityIndex: data.originalQualityIndex,
      originalBitrate: data.originalBitrate,
      originalResolution: data.originalResolution,
      originalFps: data.originalFps,
      
      // Target state
      targetQualityIndex: data.targetQualityIndex,
      targetBitrate: data.targetBitrate,
      targetResolution: data.targetResolution,
      targetFps: data.targetFps,
      
      // Network metrics (at switch time)
      networkSpeed: data.networkSpeed, // Mbps
      networkBandwidth: data.networkBandwidth,
      rtt: data.rtt, // ms
      jitter: data.jitter, // ms
      packetLoss: data.packetLoss, // %
      downlinkStdDev: data.downlinkStdDev,
      networkQuality: data.networkQuality, // string: "Excellent", "Good", etc.
      
      // Buffer state
      bufferedSeconds: data.bufferedSeconds,
      videoLoadPercentile: data.videoLoadPercentile,
      audioLoadPercentile: data.audioLoadPercentile,
      
      // Device info
      devicePixelRatio: data.devicePixelRatio,
      screenWidth: data.screenWidth,
      screenHeight: data.screenHeight,
      deviceType: data.deviceType, // 'mobile', 'tablet', 'desktop'
      
      // Playback state
      currentTime: data.currentTime,
      duration: data.duration,
      playbackRate: data.playbackRate,
      droppedFrames: data.droppedFrames,
      totalFrames: data.totalFrames,
      avgDecodeTime: data.avgDecodeTime, // ms
      cvActivityScore: data.cvActivityScore,
      
      // Context
      audioMode: data.audioMode,
      backgroundPlay: data.backgroundPlay,
      autoRes: data.autoRes,
      
      // Timing (to be filled on complete)
      switchStartTime: performance.now(),
      switchEndTime: null,
      timeToPlay: null,
      
      // Outcome (to be filled)
      success: null,
      rebuffered: null,
      rebufferDuration: null,
      droppedFramesAfter: null,
      switchBackQuality: null
    };
  }

  // Complete the quality switch tracking
  completeQualitySwitch(outcome) {
    if (!this.currentSwitch) return;
    
    this.currentSwitch.switchEndTime = performance.now();
    this.currentSwitch.timeToPlay = this.currentSwitch.switchEndTime - this.currentSwitch.switchStartTime;
    this.currentSwitch.fast = this.currentSwitch.timeToPlay < 1000; // < 1 second
    
    // Outcome metrics
    this.currentSwitch.success = outcome.success;
    this.currentSwitch.rebuffered = outcome.rebuffered || false;
    this.currentSwitch.rebufferDuration = outcome.rebufferDuration || 0;
    this.currentSwitch.droppedFramesAfter = outcome.droppedFramesAfter || 0;
    this.currentSwitch.switchBackQuality = outcome.switchBackQuality || null;
    
    // Calculate derived metrics
    this.currentSwitch.bitrateRatio = this.currentSwitch.targetBitrate / this.currentSwitch.originalBitrate;
    this.currentSwitch.estimatedLoadTime = this.calculateEstimatedLoadTime(
      this.currentSwitch.targetBitrate,
      this.currentSwitch.networkSpeed
    );
    
    // Add to events queue
    this.events.push(this.currentSwitch);
    this.currentSwitch = null;
    
    // Upload if batch is full
    /*
    if (this.events.length >= this.maxBatchSize) {
      this.uploadTelemetry();
    }*/

   document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        window.videoQualityTelemetry.uploadTelemetry();
      }
    });

    window.addEventListener('beforeunload', () => {
      window.videoQualityTelemetry.uploadTelemetry();
    });
  }

  // Calculate estimated load time (same as in your code)
  calculateEstimatedLoadTime(bitrateKbps, networkSpeedMbps) {
    const requiredKilobits = bitrateKbps * 5; // 5 seconds of video
    const networkSpeedKbps = networkSpeedMbps * 1000;
    return requiredKilobits / networkSpeedKbps; // seconds
  }

  // Build feature vector for ML model
  buildFeatureVector(data) {
    return [
      // Network features (11 features)
      data.networkSpeed,
      data.networkBandwidth || data.networkSpeed,
      data.rtt,
      data.jitter,
      data.packetLoss,
      data.downlinkStdDev,
      this.mapNetworkQuality(data.networkQuality),
      
      // Quality change features (4 features)
      data.targetQualityIndex - data.originalQualityIndex, // quality delta
      data.targetBitrate / data.originalBitrate, // bitrate ratio
      data.targetBitrate,
      this.calculateEstimatedLoadTime(data.targetBitrate, data.networkSpeed),
      
      // Buffer features (3 features)
      data.bufferedSeconds,
      data.videoLoadPercentile,
      data.audioLoadPercentile,
      
      // Device features (4 features)
      data.devicePixelRatio,
      data.screenWidth * data.screenHeight / 1e6, // megapixels
      this.mapDeviceType(data.deviceType),
      data.targetResolution / 1e6, // target megapixels
      
      // Playback features (6 features)
      data.currentTime / data.duration, // progress
      data.droppedFrames / Math.max(data.totalFrames, 1), // drop rate
      data.avgDecodeTime,
      data.cvActivityScore,
      data.playbackRate,
      data.targetFps,
      
      // Context features (3 features)
      data.audioMode ? 1 : 0,
      data.backgroundPlay ? 1 : 0,
      data.autoRes ? 1 : 0
    ];
  }

  mapNetworkQuality(quality) {
    const map = {
      'Excellent': 5,
      'Very Good': 4,
      'Good': 3,
      'Fair': 2,
      'Bad': 1,
      'Very Bad': 0
    };
    return map[quality] || 2;
  }

  mapDeviceType(type) {
    const map = { 'desktop': 2, 'tablet': 1, 'mobile': 0 };
    return map[type] || 0;
  }

  // Upload telemetry to server
  async uploadTelemetry() {
    if (this.events.length === 0) return;
    
    const batch = this.events.splice(0, this.maxBatchSize);
    
    // Get user from localStorage or default to 'guest'
    let user = 'guest';
    const customURL = localStorage.getItem('customURL');
    if (customURL && customURL.startsWith('@')) {
      user = customURL.substring(1); // Remove '@' prefix
    } else if (customURL) {
      user = customURL;
    }
    
    try {
      await fetch(this.uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user,
          batch: batch,
          version: '1.0'
        })
      });
      console.log(`Uploaded ${batch.length} telemetry events`);
    } catch (error) {
      console.error('Telemetry upload failed:', error);
      // Re-add to queue (optional retry logic)
      this.events.unshift(...batch);
    }
  }

  // Periodic upload (call this on visibility change or interval)
  schedulePeriodicUpload(intervalMs = 60000) {
    setInterval(() => {
      if (this.events.length > 0) {
        this.uploadTelemetry();
      }
    }, intervalMs);
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }
}

// Global instance
window.videoQualityTelemetry = new VideoQualityTelemetry();