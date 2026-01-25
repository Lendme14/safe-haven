import {
  checkBiometricAvailable,
  authenticateBiometric,
  isCordova,
} from './cordovaBridge';

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
  private biometryType: 'fingerprint' | 'faceRecognition' | 'iris' | 'unknown' = 'unknown';
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
      if (isCordova()) {
        // Use Cordova fingerprint plugin
        const result = await checkBiometricAvailable();
        this.isAvailable = result.isAvailable;
        this.biometryType = this.mapBiometryType(result.biometryType);
      } else {
        // Fallback to WebAuthn for web
        if (
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential === 'function'
        ) {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          this.isAvailable = available;

          if (available) {
            this.detectBiometryType();
          }
        }
      }
    } catch (error) {
      console.warn('Biometric initialization warning:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Map Cordova biometry type to our enum
   */
  private mapBiometryType(type: string): 'fingerprint' | 'faceRecognition' | 'iris' | 'unknown' {
    const typeMap: Record<string, 'fingerprint' | 'faceRecognition' | 'iris' | 'unknown'> = {
      fingerprint: 'fingerprint',
      finger: 'fingerprint',
      touch: 'fingerprint',
      face: 'faceRecognition',
      faceid: 'faceRecognition',
      iris: 'iris',
    };
    return typeMap[type.toLowerCase()] || 'unknown';
  }

  /**
   * Detect biometry type based on platform (web fallback)
   */
  private detectBiometryType(): void {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) {
      this.biometryType = 'fingerprint';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
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
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (isCordova()) {
      const result = await checkBiometricAvailable();
      return result.isAvailable;
    }
    return this.isAvailable;
  }

  /**
   * Get supported biometry types
   */
  async getBiometryType(): Promise<string> {
    if (isCordova()) {
      const result = await checkBiometricAvailable();
      return result.biometryType;
    }
    return this.biometryType;
  }

  /**
   * Perform biometric authentication
   */
  async authenticate(options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    try {
      if (isCordova()) {
        const result = await authenticateBiometric({
          title: options.reason || 'Authenticate',
          subtitle: options.subtitle,
          description: options.description,
          disableBackup: false,
        });

        return {
          success: result.success,
          biometryType: this.biometryType,
          message: result.message,
        };
      }

      // Web fallback using WebAuthn
      if (!this.isAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device',
        };
      }

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
   * Perform WebAuthn authentication (web fallback)
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
  async registerBiometric(options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    try {
      if (isCordova()) {
        // Cordova fingerprint plugin handles registration automatically
        // Just verify the user can authenticate
        return this.authenticate(options);
      }

      // Web fallback
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
   * Perform WebAuthn registration (web fallback)
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
          name: 'Sentri',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: 'user@sentri.local',
          displayName: 'User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
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
