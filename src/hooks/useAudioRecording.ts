import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export const useAudioRecording = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentEventIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const getSupportedMimeType = useCallback((): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }, []);

  const startRecording = useCallback(async (userId: string, safetyEventId: string): Promise<boolean> => {
    if (!userId || !safetyEventId) {
      console.log('Cannot start recording: missing user or safety event', { userId, safetyEventId });
      return false;
    }

    // Store refs for later use
    currentUserIdRef.current = userId;
    currentEventIdRef.current = safetyEventId;

    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      console.log('Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ ...prev, error: 'Recording error occurred', isRecording: false }));
        cleanup();
      };

      mediaRecorder.onstart = () => {
        startTimeRef.current = Date.now();
        console.log('Recording started at:', new Date().toISOString());
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Request data every 5 seconds for safety (in case of crash)
      mediaRecorder.start(5000);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      });

      toast({
        title: "Recording Started",
        description: "Audio is being captured for your safety.",
      });

      return true;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: message }));
      
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });

      return false;
    }
  }, [getSupportedMimeType]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      console.log('No active recording to stop');
      return null;
    }

    const userId = currentUserIdRef.current;
    const safetyEventId = currentEventIdRef.current;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }

        const mimeType = getSupportedMimeType();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        console.log('Audio blob size:', audioBlob.size, 'Duration:', duration);

        // Upload to storage if we have a valid blob
        if (audioBlob.size > 0 && userId && safetyEventId) {
          try {
            const fileExt = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'webm';
            const fileName = `${userId}/${safetyEventId}/${Date.now()}.${fileExt}`;

            console.log('Uploading recording to:', fileName);

            const { error: uploadError } = await supabase.storage
              .from('recordings')
              .upload(fileName, audioBlob, {
                contentType: mimeType,
                upsert: false,
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              toast({
                title: "Upload Error",
                description: "Recording saved locally but cloud upload failed.",
                variant: "destructive",
              });
            } else {
              // Save recording metadata
              const { error: dbError } = await supabase.from('recordings').insert({
                user_id: userId,
                safety_event_id: safetyEventId,
                file_url: fileName,
                file_type: 'audio',
                duration_seconds: duration,
                file_size_bytes: audioBlob.size,
              });

              if (dbError) {
                console.error('Database error:', dbError);
              } else {
                toast({
                  title: "Recording Saved",
                  description: `${duration}s audio recording has been saved.`,
                });
              }
            }
          } catch (error) {
            console.error('Error saving recording:', error);
          }
        }

        cleanup();
        setState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          error: null,
        });

        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, [getSupportedMimeType]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    currentEventIdRef.current = null;
    currentUserIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};
