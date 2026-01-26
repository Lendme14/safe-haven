/**
 * Native Bridge Configuration and Utilities
 * 
 * This file provides utilities for interacting with native platform code
 * using Cordova plugins for advanced features.
 */

import { isCordova } from './cordovaBridge';

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
 * Web/Cordova implementation
 */
class NativeBridgeImpl implements NativeBridgePlugin {
  async initAudioSession(): Promise<void> {
    console.log('Audio session initialized');
  }

  async getAudioLevel(): Promise<{ level: number }> {
    return { level: 0 };
  }

  async setAudioOutput(options: { output: 'speaker' | 'receiver' }): Promise<void> {
    console.log(`Audio output set to ${options.output}`);
  }

  async biometricGetStatus(): Promise<{ available: boolean; enrolled: number }> {
    if (isCordova() && (window as any).Fingerprint) {
      return new Promise((resolve) => {
        (window as any).Fingerprint.isAvailable(
          (result: any) => resolve({ available: true, enrolled: result ? 1 : 0 }),
          () => resolve({ available: false, enrolled: 0 })
        );
      });
    }
    return { available: false, enrolled: 0 };
  }

  async biometricCancel(): Promise<void> {
    console.log('Biometric authentication cancelled');
  }

  async notificationPermission(): Promise<{ granted: boolean }> {
    if (isCordova() && (window as any).cordova?.plugins?.notification?.local) {
      return new Promise((resolve) => {
        (window as any).cordova.plugins.notification.local.hasPermission(
          (granted: boolean) => resolve({ granted })
        );
      });
    }
    return { granted: Notification?.permission === 'granted' };
  }

  async notificationChannels(): Promise<{ channels: any[] }> {
    return { channels: [] };
  }
}

// Singleton instance
let bridgeInstance: NativeBridgePlugin | null = null;

/**
 * Get reference to native bridge plugin
 */
export const getNativeBridgePlugin = (): NativeBridgePlugin => {
  if (!bridgeInstance) {
    bridgeInstance = new NativeBridgeImpl();
  }
  return bridgeInstance;
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
