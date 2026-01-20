import { Platform } from '@capacitor/core';

export interface BiometricAuthOptions {
  reason?: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
  fallbackTitle?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  biometryType?: 'fingerprint' | 'faceRecognition' | 'iris' | 'unknown';
  message?: string;
}

export class BiometricAuthService {
  private biometryType: 'fingerprint' | 'faceRecognition' | 'iris' | 'unknown' =
    'unknown';
  private isAvailable = false;
  private enrolledCount = 0;

  constructor() {
    this.initializeBiometrics();
  }

  /**
   * Initialize biometric support detection
   */
  private async initializeBiometrics(): Promise<void> {
    try {
      // Check if WebAuthn API is available
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential === 'function'
      ) {
        const available =
          await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        this.isAvailable = available;

        if (available) {
          // Detect biometry type based on user agent or platform
          this.detectBiometryType();
        }
      }
    } catch (error) {
      console.warn('Biometric initialization warning:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Detect biometry type based on platform
   */
  private detectBiometryType(): void {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) {
      // Android typically supports fingerprint and face
      this.biometryType = this.hasSystemBiometric()
        ? 'fingerprint'
        : 'faceRecognition';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iOS supports Face ID or Touch ID
      this.biometryType = this.detectiOSBiometry();
    } else {
      this.biometryType = 'fingerprint';
    }
  }

  /**
   * Detect iOS biometry type
   */
  private detectiOSBiometry(): 'fingerprint' | 'faceRecognition' {
    const userAgent = navigator.userAgent;
    // Face ID typically on newer iPhone models (X and later)
    if (
      userAgent.includes('iPhone') &&
      !userAgent.includes('iPhone 5') &&
      !userAgent.includes('iPhone 6') &&
      !userAgent.includes('iPhone 7') &&
      !userAgent.includes('iPhone 8')
    ) {
      return 'faceRecognition';
    }
    return 'fingerprint';
  }

  /**
   * Check if system has biometric capability
   */
  private hasSystemBiometric(): boolean {
    // Try to access fingerprint API through cordova or capacitor
    return (window as any).plugins?.fingerprint !== undefined;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  /**
   * Get supported biometry types
   */
  async getBiometryType(): Promise<string> {
    return this.biometryType;
  }

  /**
   * Perform biometric authentication
   */
  async authenticate(
    options: BiometricAuthOptions = {}
  ): Promise<BiometricAuthResult> {
    try {
      if (!this.isAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device',
        };
      }

      // Try WebAuthn first
      const credential = await this.performWebAuthnAuth(options);

      if (credential) {
        return {
          success: true,
          biometryType: this.biometryType,
          message: 'Authentication successful',
        };
      }

      return {
        success: false,
        message: 'Authentication failed',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Biometric authentication error:', error);

      return {
        success: false,
        biometryType: this.biometryType,
        message: `Authentication error: ${errorMessage}`,
      };
    }
  }

  /**
   * Perform WebAuthn authentication
   */
  private async performWebAuthnAuth(
    options: BiometricAuthOptions
  ): Promise<PublicKeyCredential | null> {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported');
    }

    const challenge = this.generateChallenge();
    const publicKeyOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        timeout: 30000,
        userVerification: 'preferred',
      },
    };

    try {
      const assertion = await navigator.credentials.get(publicKeyOptions);
      return (assertion as PublicKeyCredential) || null;
    } catch (error) {
      console.warn('WebAuthn authentication failed:', error);
      return null;
    }
  }

  /**
   * Register biometric credential
   */
  async registerBiometric(
    options: BiometricAuthOptions = {}
  ): Promise<BiometricAuthResult> {
    try {
      if (!this.isAvailable) {
        return {
          success: false,
          message: 'Biometric registration is not available on this device',
        };
      }

      const credential = await this.performWebAuthnRegistration();

      if (credential) {
        this.enrolledCount++;
        return {
          success: true,
          biometryType: this.biometryType,
          message: 'Biometric registered successfully',
        };
      }

      return {
        success: false,
        message: 'Biometric registration failed',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Biometric registration error:', error);

      return {
        success: false,
        message: `Registration error: ${errorMessage}`,
      };
    }
  }

  /**
   * Perform WebAuthn registration
   */
  private async performWebAuthnRegistration(): Promise<PublicKeyCredential | null> {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported');
    }

    const challenge = this.generateChallenge();
    const userId = this.generateUserId();

    const publicKeyOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Safe Haven',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: 'user@safehaven.local',
          displayName: 'User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 30000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
      },
    };

    try {
      const credential = (await navigator.credentials.create(
        publicKeyOptions
      )) as PublicKeyCredential | null;
      return credential;
    } catch (error) {
      console.warn('WebAuthn registration failed:', error);
      return null;
    }
  }

  /**
   * Generate a random challenge for WebAuthn
   */
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  /**
   * Generate a user ID for WebAuthn
   */
  private generateUserId(): ArrayBuffer {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  /**
   * Get number of enrolled biometrics
   */
  getEnrolledBiometricCount(): number {
    return this.enrolledCount;
  }

  /**
   * Delete/clear biometric data (app-side only)
   */
  async clearBiometric(): Promise<boolean> {
    try {
      // Note: This only clears app-side knowledge
      // Actual biometric data on device cannot be deleted from web
      this.enrolledCount = 0;
      return true;
    } catch (error) {
      console.error('Error clearing biometric:', error);
      return false;
    }
  }
}

// Extend Window interface for WebAuthn
declare global {
  interface Window {
    PublicKeyCredential?: typeof PublicKeyCredential;
  }
}

export default new BiometricAuthService();
