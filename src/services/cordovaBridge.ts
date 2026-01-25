/**
 * Cordova Native Bridge Service
 * Provides access to native device features through Cordova plugins
 */

// Check if running in Cordova environment
export const isCordova = (): boolean => {
  return typeof (window as any).cordova !== 'undefined';
};

// Wait for Cordova device ready
export const waitForDeviceReady = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isCordova()) {
      resolve();
      return;
    }
    
    document.addEventListener('deviceready', () => {
      console.log('Cordova device ready');
      resolve();
    }, false);
  });
};

/**
 * Device Information
 */
export const getDeviceInfo = (): any => {
  if (!isCordova() || !(window as any).device) {
    return {
      platform: 'web',
      version: 'unknown',
      uuid: 'web-browser',
      model: navigator.userAgent,
      manufacturer: 'unknown',
      isVirtual: false,
    };
  }
  
  const device = (window as any).device;
  return {
    platform: device.platform,
    version: device.version,
    uuid: device.uuid,
    model: device.model,
    manufacturer: device.manufacturer,
    isVirtual: device.isVirtual,
  };
};

/**
 * Geolocation Service
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  });
};

export const watchPosition = (
  successCallback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number => {
  return navigator.geolocation.watchPosition(
    successCallback,
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 5000,
    }
  );
};

export const clearWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Biometric Authentication Service
 */
export const checkBiometricAvailable = (): Promise<{ isAvailable: boolean; biometryType: string }> => {
  return new Promise((resolve) => {
    if (!isCordova() || !(window as any).Fingerprint) {
      resolve({ isAvailable: false, biometryType: 'none' });
      return;
    }
    
    (window as any).Fingerprint.isAvailable(
      (result: any) => {
        resolve({
          isAvailable: true,
          biometryType: result || 'fingerprint',
        });
      },
      () => {
        resolve({ isAvailable: false, biometryType: 'none' });
      }
    );
  });
};

export const authenticateBiometric = (options?: {
  title?: string;
  subtitle?: string;
  description?: string;
  disableBackup?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
  return new Promise((resolve) => {
    if (!isCordova() || !(window as any).Fingerprint) {
      resolve({ success: false, message: 'Biometric not available' });
      return;
    }
    
    (window as any).Fingerprint.show(
      {
        title: options?.title || 'Authenticate',
        subtitle: options?.subtitle || '',
        description: options?.description || 'Use your biometric to authenticate',
        disableBackup: options?.disableBackup || false,
      },
      () => {
        resolve({ success: true });
      },
      (error: any) => {
        resolve({ success: false, message: error.message || 'Authentication failed' });
      }
    );
  });
};

/**
 * Local Notifications Service
 */
export const scheduleNotification = (options: {
  id?: number;
  title: string;
  text: string;
  trigger?: { at?: Date; in?: number };
  foreground?: boolean;
  ongoing?: boolean;
  sound?: string;
}): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!isCordova() || !(window as any).cordova?.plugins?.notification?.local) {
      // Fallback to web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, { body: options.text });
        resolve(options.id || Date.now());
      } else {
        reject(new Error('Notifications not available'));
      }
      return;
    }
    
    const notification = (window as any).cordova.plugins.notification.local;
    const notificationId = options.id || Math.floor(Math.random() * 100000);
    
    notification.schedule({
      id: notificationId,
      title: options.title,
      text: options.text,
      trigger: options.trigger,
      foreground: options.foreground ?? true,
      ongoing: options.ongoing ?? false,
      sound: options.sound,
      priority: 2,
      lockscreen: true,
      wakeup: true,
    });
    
    resolve(notificationId);
  });
};

export const cancelNotification = (id: number): Promise<void> => {
  return new Promise((resolve) => {
    if (!isCordova() || !(window as any).cordova?.plugins?.notification?.local) {
      resolve();
      return;
    }
    
    (window as any).cordova.plugins.notification.local.cancel(id, resolve);
  });
};

export const cancelAllNotifications = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isCordova() || !(window as any).cordova?.plugins?.notification?.local) {
      resolve();
      return;
    }
    
    (window as any).cordova.plugins.notification.local.cancelAll(resolve);
  });
};

/**
 * Vibration Service
 */
export const vibrate = (pattern: number | number[]): void => {
  if (!isCordova() && navigator.vibrate) {
    navigator.vibrate(pattern);
    return;
  }
  
  if ((window as any).navigator?.vibrate) {
    (window as any).navigator.vibrate(pattern);
  }
};

/**
 * Status Bar Service
 */
export const setStatusBarStyle = (style: 'light' | 'dark'): void => {
  if (!isCordova() || !(window as any).StatusBar) return;
  
  const StatusBar = (window as any).StatusBar;
  if (style === 'light') {
    StatusBar.styleLightContent();
  } else {
    StatusBar.styleDefault();
  }
};

export const setStatusBarBackgroundColor = (color: string): void => {
  if (!isCordova() || !(window as any).StatusBar) return;
  (window as any).StatusBar.backgroundColorByHexString(color);
};

export const hideStatusBar = (): void => {
  if (!isCordova() || !(window as any).StatusBar) return;
  (window as any).StatusBar.hide();
};

export const showStatusBar = (): void => {
  if (!isCordova() || !(window as any).StatusBar) return;
  (window as any).StatusBar.show();
};

/**
 * Media Capture Service
 */
export interface CaptureResult {
  fullPath: string;
  name: string;
  type: string;
  size: number;
}

export const captureAudio = (options?: {
  limit?: number;
  duration?: number;
}): Promise<CaptureResult[]> => {
  return new Promise((resolve, reject) => {
    if (!isCordova() || !(window as any).navigator?.device?.capture) {
      reject(new Error('Media capture not available'));
      return;
    }
    
    (window as any).navigator.device.capture.captureAudio(
      (mediaFiles: any[]) => {
        resolve(mediaFiles.map((f) => ({
          fullPath: f.fullPath,
          name: f.name,
          type: f.type,
          size: f.size,
        })));
      },
      (error: any) => {
        reject(new Error(error.message || 'Capture failed'));
      },
      {
        limit: options?.limit || 1,
        duration: options?.duration || 60,
      }
    );
  });
};

/**
 * File System Service
 */
export const getFileSystem = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isCordova() || !(window as any).requestFileSystem) {
      reject(new Error('File system not available'));
      return;
    }
    
    (window as any).requestFileSystem(
      (window as any).LocalFileSystem.PERSISTENT,
      0,
      (fs: any) => resolve(fs),
      (error: any) => reject(error)
    );
  });
};

export const readFileAsBlob = (path: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!isCordova()) {
      reject(new Error('File system not available'));
      return;
    }
    
    (window as any).resolveLocalFileSystemURL(
      path,
      (fileEntry: any) => {
        fileEntry.file(
          (file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                resolve(new Blob([reader.result], { type: file.type }));
              } else {
                reject(new Error('Failed to read file'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
          },
          (error: any) => reject(error)
        );
      },
      (error: any) => reject(error)
    );
  });
};

// Export all services
export default {
  isCordova,
  waitForDeviceReady,
  getDeviceInfo,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  checkBiometricAvailable,
  authenticateBiometric,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  vibrate,
  setStatusBarStyle,
  setStatusBarBackgroundColor,
  hideStatusBar,
  showStatusBar,
  captureAudio,
  getFileSystem,
  readFileAsBlob,
};
