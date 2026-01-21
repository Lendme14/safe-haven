import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalNotificationSchema, Importance } from '@capacitor/local-notifications';

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
      // Request permission for notifications
      const permResult = await LocalNotifications.requestPermissions();
      console.log('Notification permission result:', permResult);

      // Listen for notification actions
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notification) => {
          console.log('Notification action performed:', notification);
        }
      );

      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received:', notification);
      });
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
      const notification = this.buildNotification(id, options);

      await LocalNotifications.schedule({
        notifications: [notification],
      });

      return id;
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  /**
   * Send a persistent notification
   */
  async showPersistentNotification(
    options: NotificationOptions
  ): Promise<number> {
    const id = options.id || this.notificationId++;

    // Mark as ongoing (persistent on Android)
    const persistentOptions: NotificationOptions = {
      ...options,
      id,
      autoCancel: false,
      ongoing: true,
    };

    this.persistentNotifications.set(id, persistentOptions);

    try {
      const notification = this.buildNotification(id, persistentOptions);
      await LocalNotifications.schedule({
        notifications: [notification],
      });

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

      const notification = this.buildNotification(id, updated);
      await LocalNotifications.schedule({
        notifications: [notification],
      });
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
      await LocalNotifications.cancel({ notifications: [{ id }] });
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
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.notifications.map(n => ({ id: n.id })) 
        });
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
   * Build notification object for Capacitor
   */
  private buildNotification(
    id: number,
    options: NotificationOptions
  ): LocalNotificationSchema {
    return {
      id,
      title: options.title,
      body: options.body,
      largeBody: options.largeBody,
      summaryText: options.summaryText,
      autoCancel: options.autoCancel !== false,
      ongoing: options.ongoing || false,
      smallIcon: options.smallIcon || 'ic_stat_icon_config_sample',
      largeIcon: options.largeIcon,
      iconColor: options.iconColor || '#488AFF',
      sound: options.sound,
      channelId: options.channelId || 'default',
      schedule: options.schedule,
    };
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<LocalNotificationSchema[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Create notification channel (Android)
   */
  async createChannel(
    id: string,
    name: string,
    description?: string,
    importance: Importance = 4 as Importance
  ): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id,
        name,
        description,
        importance,
        lights: true,
        lightColor: '#488AFF',
        sound: 'beep.wav',
        vibration: true,
      });
    } catch (error) {
      console.error('Error creating notification channel:', error);
      throw error;
    }
  }

  /**
   * Delete notification channel (Android)
   */
  async deleteChannel(id: string): Promise<void> {
    try {
      await LocalNotifications.deleteChannel({ id });
    } catch (error) {
      console.error('Error deleting notification channel:', error);
      throw error;
    }
  }

  /**
   * List notification channels
   */
  async listChannels(): Promise<any[]> {
    try {
      const result = await LocalNotifications.listChannels();
      return result.channels;
    } catch (error) {
      console.error('Error listing channels:', error);
      return [];
    }
  }
}

export default new NotificationService();
