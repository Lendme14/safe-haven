import {
  scheduleNotification,
  cancelNotification as cordovaCancelNotification,
  cancelAllNotifications as cordovaCancelAllNotifications,
  isCordova,
} from './cordovaBridge';

export interface NotificationOptions {
  id?: number;
  title: string;
  body: string;
  largeBody?: string;
  summaryText?: string;
  autoCancel?: boolean;
  ongoing?: boolean;
  smallIcon?: string;
  largeIcon?: string;
  iconColor?: string;
  sound?: string;
  vibrate?: boolean;
  tag?: string;
  channelId?: string;
  schedule?: { at: Date };
  [key: string]: any;
}

export interface NotificationAction {
  id: string;
  title: string;
  requiresAuthentication?: boolean;
  foreground?: boolean;
  destructive?: boolean;
}

export class NotificationService {
  private notificationId = 1;
  private persistentNotifications: Map<number, NotificationOptions> = new Map();

  constructor() {
    this.initializeNotifications();
  }

  /**
   * Initialize notification system
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // Request permission for web notifications
      if (!isCordova() && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Web notification permission:', permission);
      }

      // Cordova notifications don't need explicit permission request on init
      // They request when first notification is scheduled
      console.log('Notification service initialized');
    } catch (error) {
      console.warn('Notification initialization error:', error);
    }
  }

  /**
   * Send a simple notification
   */
  async showNotification(options: NotificationOptions): Promise<number> {
    try {
      const id = options.id || this.notificationId++;

      if (isCordova()) {
        await scheduleNotification({
          id,
          title: options.title,
          text: options.body,
          foreground: true,
          ongoing: options.ongoing,
          sound: options.sound,
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          tag: options.tag || String(id),
          icon: options.smallIcon,
        });
      }

      return id;
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  /**
   * Send a persistent notification
   */
  async showPersistentNotification(options: NotificationOptions): Promise<number> {
    const id = options.id || this.notificationId++;

    const persistentOptions: NotificationOptions = {
      ...options,
      id,
      autoCancel: false,
      ongoing: true,
    };

    this.persistentNotifications.set(id, persistentOptions);

    try {
      if (isCordova()) {
        await scheduleNotification({
          id,
          title: options.title,
          text: options.body,
          foreground: true,
          ongoing: true,
          sound: options.sound,
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          tag: String(id),
          requireInteraction: true,
        });
      }

      return id;
    } catch (error) {
      console.error('Error showing persistent notification:', error);
      throw error;
    }
  }

  /**
   * Update an existing persistent notification
   */
  async updatePersistentNotification(
    id: number,
    options: Partial<NotificationOptions>
  ): Promise<void> {
    try {
      const existing = this.persistentNotifications.get(id);
      if (!existing) {
        throw new Error('Notification not found');
      }

      const updated: NotificationOptions = {
        ...existing,
        ...options,
        id,
        title: options.title || existing.title,
        body: options.body || existing.body,
      };

      this.persistentNotifications.set(id, updated);

      if (isCordova()) {
        await scheduleNotification({
          id,
          title: updated.title,
          text: updated.body,
          foreground: true,
          ongoing: true,
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(updated.title, {
          body: updated.body,
          tag: String(id),
          requireInteraction: true,
        });
      }
    } catch (error) {
      console.error('Error updating persistent notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a notification
   */
  async cancelNotification(id: number): Promise<void> {
    try {
      if (isCordova()) {
        await cordovaCancelNotification(id);
      }
      this.persistentNotifications.delete(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (isCordova()) {
        await cordovaCancelAllNotifications();
      }
      this.persistentNotifications.clear();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  /**
   * Show progress notification
   */
  async showProgressNotification(
    id: number,
    title: string,
    progress: number,
    maxProgress: number = 100
  ): Promise<void> {
    const percentage = Math.round((progress / maxProgress) * 100);
    const progressText = `${percentage}%`;

    await this.updatePersistentNotification(id, {
      title,
      body: `Progress: ${progressText}`,
      summaryText: `${progress}/${maxProgress}`,
    });
  }

  /**
   * Show download notification
   */
  async showDownloadNotification(
    filename: string,
    progress: number,
    totalSize: number
  ): Promise<number> {
    const id = this.notificationId++;
    const percentage = Math.round((progress / totalSize) * 100);
    const downloadedMB = (progress / (1024 * 1024)).toFixed(2);
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);

    await this.showPersistentNotification({
      id,
      title: 'Downloading',
      body: filename,
      summaryText: `${downloadedMB}MB / ${totalMB}MB (${percentage}%)`,
      ongoing: true,
    });

    return id;
  }

  /**
   * Show alert notification
   */
  async showAlertNotification(title: string, message: string): Promise<number> {
    return this.showNotification({
      title,
      body: message,
      autoCancel: true,
    });
  }

  /**
   * Show success notification
   */
  async showSuccessNotification(title: string, message?: string): Promise<number> {
    return this.showNotification({
      title,
      body: message || 'Success',
      autoCancel: true,
    });
  }

  /**
   * Show error notification
   */
  async showErrorNotification(title: string, message?: string): Promise<number> {
    return this.showNotification({
      title,
      body: message || 'An error occurred',
      autoCancel: true,
    });
  }

  /**
   * Get pending notifications (Cordova-only feature)
   */
  async getPendingNotifications(): Promise<any[]> {
    // Not directly supported in Cordova local notifications plugin
    // Return from our internal map instead
    return Array.from(this.persistentNotifications.values());
  }

  /**
   * Create notification channel (Android - handled via config.xml in Cordova)
   */
  async createChannel(
    id: string,
    name: string,
    description?: string,
    importance: number = 4
  ): Promise<void> {
    console.log('Notification channel creation handled via config.xml in Cordova');
  }

  /**
   * Delete notification channel
   */
  async deleteChannel(id: string): Promise<void> {
    console.log('Notification channel deletion not supported in Cordova');
  }

  /**
   * List notification channels
   */
  async listChannels(): Promise<any[]> {
    console.log('Listing channels not supported in Cordova');
    return [];
  }
}

export default new NotificationService();
