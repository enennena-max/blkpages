/**
 * Device Fingerprint Capture for BlkPages
 * Captures device fingerprint using FingerprintJS (if available) or generates a simple hash
 * Stores in localStorage for use during signup
 */

(function() {
  'use strict';

  const FINGERPRINT_STORAGE_KEY = 'blk_device_fp';
  
  /**
   * Simple device fingerprint using available browser APIs
   */
  function generateSimpleFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown'
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36).substring(0, 12).toUpperCase();
  }

  /**
   * Capture device fingerprint using FingerprintJS if available
   * Falls back to simple fingerprint otherwise
   */
  async function captureDeviceFingerprint() {
    try {
      // Try to use FingerprintJS if available
      if (typeof FingerprintJS !== 'undefined' && FingerprintJS.load) {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const deviceId = result.visitorId;
        localStorage.setItem(FINGERPRINT_STORAGE_KEY, deviceId);
        console.log('✅ Device fingerprint captured (FingerprintJS)');
        return deviceId;
      }
    } catch (error) {
      console.warn('⚠️ FingerprintJS not available, using simple fingerprint');
    }

    // Fallback to simple fingerprint
    const simpleFp = generateSimpleFingerprint();
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, simpleFp);
    console.log('✅ Device fingerprint captured (simple)');
    return simpleFp;
  }

  /**
   * Get stored device fingerprint
   */
  function getDeviceFingerprint() {
    return localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  }

  /**
   * Initialize device fingerprint capture on page load
   */
  if (typeof document !== 'undefined') {
    // Auto-capture on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', captureDeviceFingerprint);
    } else {
      captureDeviceFingerprint();
    }

    // Expose to global scope for use in forms
    window.BlkDeviceFingerprint = {
      get: getDeviceFingerprint,
      capture: captureDeviceFingerprint
    };
  }

  // Export for Node.js/CommonJS if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      get: getDeviceFingerprint,
      capture: captureDeviceFingerprint,
      generateSimple: generateSimpleFingerprint
    };
  }
})();
