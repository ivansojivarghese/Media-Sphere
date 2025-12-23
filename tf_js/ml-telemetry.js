// ml-telemetry.js - Telemetry collection for ML training

class VideoQualityTelemetry {
  constructor() {
    this.events = [];
    this.currentSwitch = null;
    this.maxBatchSize = 50;
    // this.uploadEndpoint = '/api/telemetry'; // Your backend endpoint
    this.uploadEndpoint = 'https://rest-server-psi.vercel.app/api/telemetry'; // Your backend endpoint
    
    // Register upload triggers once
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.uploadTelemetry();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.uploadTelemetry();
    });
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
    
    // Upload immediately after each quality switch
    this.uploadTelemetry();
  }

  // Calculate estimated load time
  // bitrateBps: target bitrate in BITS per second (not kilobits!)
  // networkSpeedMBps: network speed in MEGABYTES per second
  calculateEstimatedLoadTime(bitrateBps, networkSpeedMBps) {
    const bitrateKbps = bitrateBps / 1000; // bps → Kbps
    const requiredKilobits = bitrateKbps * 5; // 5 seconds of video
    const networkSpeedKbps = networkSpeedMBps * 8 * 1000; // MBps → Kbps
    return requiredKilobits / networkSpeedKbps; // seconds
  }

  // Build feature vector for ML model
  buildFeatureVector(data) {
    return [
      // Network features (6 features) - high signal
      data.networkSpeed,
      data.networkBandwidth || data.networkSpeed,
      data.rtt,
      data.jitter,
      data.packetLoss,
      data.downlinkStdDev,
      // this.mapNetworkQuality(data.networkQuality), // REDUNDANT: derived from other network metrics
      
      // Quality change features (4 features) - high signal
      data.targetQualityIndex - data.originalQualityIndex, // quality delta
      data.targetBitrate / data.originalBitrate, // bitrate ratio
      data.targetBitrate,
      this.calculateEstimatedLoadTime(data.targetBitrate, data.networkSpeed),
      
      // Buffer features (3 features) - high signal
      data.bufferedSeconds,
      data.videoLoadPercentile,
      data.audioLoadPercentile,
      
      // Device features (4 features) - high signal
      data.devicePixelRatio,
      data.screenWidth * data.screenHeight / 1e6, // megapixels
      this.mapDeviceType(data.deviceType),
      data.targetResolution / 1e6, // target megapixels
      
      // Playback features (4 features) - high signal
      data.currentTime / data.duration, // progress
      data.droppedFrames / Math.max(data.totalFrames, 1), // drop rate
      data.avgDecodeTime,
      data.cvActivityScore,
      // data.playbackRate, // REDUNDANT: rarely changes (usually 1.0)
      // data.targetFps, // REDUNDANT: constant (always 30)
      
      // Context features - REDUNDANT: low variance, minimal signal
      // data.audioMode ? 1 : 0, // rarely varies
      // data.backgroundPlay ? 1 : 0, // rarely varies
      // data.autoRes ? 1 : 0 // usually always true
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