export interface AudioRecordingOptions {
  filename?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  audioBitRate?: number;
  audioFormat?: string;
  mediaSource?: string;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private recordingStartTime: number = 0;

  /**
   * Start audio recording
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: options.audioChannels || 1,
          sampleRate: options.audioSampleRate || 44100,
        },
        video: false,
      });

      this.stream = stream;
      this.audioChunks = [];

      const mimeType = this.getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: options.audioBitRate || 128000,
      });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        this.cleanup();
      };

      mediaRecorder.onstart = () => {
        this.recordingStartTime = Date.now();
      };

      this.mediaRecorder = mediaRecorder;
      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop audio recording and return the audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType();
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.isRecording = false;
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Get recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.isRecording || this.recordingStartTime === 0) {
      return 0;
    }
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Convert blob to base64
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert blob to file
   */
  blobToFile(blob: Blob, filename: string = 'recording.m4a'): File {
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Get supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
      'audio/aac',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.isRecording) {
      this.stopRecording().catch(console.error);
    }
    this.cleanup();
  }
}

export default new AudioRecordingService();
