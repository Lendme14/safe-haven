/**
 * Native Bridge Configuration and Utilities
 * 
 * This file provides utilities for interacting with native platform code
 * for advanced features that require direct native access.
 */

import { registerPlugin } from '@capacitor/core';

/**
 * Native module interface for custom plugins
 */
export interface NativeBridgePlugin {
  // Audio methods
  initAudioSession(): Promise<void>;
  getAudioLevel(): Promise<{ level: number }>;
  setAudioOutput(options: { output: 'speaker' | 'receiver' }): Promise<void>;

  // Biometric methods
  biometricGetStatus(): Promise<{ available: boolean; enrolled: number }>;
  biometricCancel(): Promise<void>;

  // Notification methods
  notificationPermission(): Promise<{ granted: boolean }>;
  notificationChannels(): Promise<{ channels: any[] }>;
}

/**
 * Web implementation for testing and fallback
 */
class WebNativeBridgeImpl implements NativeBridgePlugin {
  async initAudioSession(): Promise<void> {
    console.log('Web: Audio session initialized');
  }

  async getAudioLevel(): Promise<{ level: number }> {
    return { level: 0 };
  }

  async setAudioOutput(options: { output: 'speaker' | 'receiver' }): Promise<void> {
    console.log(`Web: Audio output set to ${options.output}`);
  }

  async biometricGetStatus(): Promise<{ available: boolean; enrolled: number }> {
    return { available: false, enrolled: 0 };
  }

  async biometricCancel(): Promise<void> {
    console.log('Web: Biometric authentication cancelled');
  }

  async notificationPermission(): Promise<{ granted: boolean }> {
    return { granted: Notification?.permission === 'granted' };
  }

  async notificationChannels(): Promise<{ channels: any[] }> {
    return { channels: [] };
  }
}

/**
 * Get reference to native bridge plugin
 * Custom plugins can be registered here
 */
export const getNativeBridgePlugin = (): NativeBridgePlugin => {
  return registerPlugin<NativeBridgePlugin>('NativeBridge', {
    web: () => Promise.resolve(new WebNativeBridgeImpl()),
  });
};

/**
 * Helper utilities for native operations
 */
export class NativeHelper {
  /**
   * Initialize audio session for recording/playback
   */
  static async initializeAudioSession(): Promise<void> {
    try {
      const bridge = getNativeBridgePlugin();
      await bridge.initAudioSession();
      console.log('Audio session initialized');
    } catch (error) {
      console.warn('Audio session initialization failed:', error);
    }
  }

  /**
   * Get current audio level for VU meter
   */
  static async getAudioLevel(): Promise<number> {
    try {
      const bridge = getNativeBridgePlugin();
      const result = await bridge.getAudioLevel();
      return result.level;
    } catch (error) {
      console.warn('Failed to get audio level:', error);
      return 0;
    }
  }

  /**
   * Set audio output route
   */
  static async setAudioOutput(output: 'speaker' | 'receiver'): Promise<void> {
    try {
      const bridge = getNativeBridgePlugin();
      await bridge.setAudioOutput({ output });
      console.log(`Audio output switched to ${output}`);
    } catch (error) {
      console.warn('Failed to set audio output:', error);
    }
  }

  /**
   * Get biometric status
   */
  static async getBiometricStatus(): Promise<{
    available: boolean;
    enrolled: number;
  }> {
    try {
      const bridge = getNativeBridgePlugin();
      return await bridge.biometricGetStatus();
    } catch (error) {
      console.warn('Failed to get biometric status:', error);
      return { available: false, enrolled: 0 };
    }
  }

  /**
   * Cancel ongoing biometric authentication
   */
  static async cancelBiometric(): Promise<void> {
    try {
      const bridge = getNativeBridgePlugin();
      await bridge.biometricCancel();
    } catch (error) {
      console.warn('Failed to cancel biometric:', error);
    }
  }

  /**
   * Check notification permission
   */
  static async checkNotificationPermission(): Promise<boolean> {
    try {
      const bridge = getNativeBridgePlugin();
      const result = await bridge.notificationPermission();
      return result.granted;
    } catch (error) {
      console.warn('Failed to check notification permission:', error);
      return false;
    }
  }

  /**
   * Get notification channels (Android)
   */
  static async getNotificationChannels(): Promise<any[]> {
    try {
      const bridge = getNativeBridgePlugin();
      const result = await bridge.notificationChannels();
      return result.channels;
    } catch (error) {
      console.warn('Failed to get notification channels:', error);
      return [];
    }
  }
}

export default NativeHelper;
