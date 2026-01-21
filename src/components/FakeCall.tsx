import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, X } from 'lucide-react';
import { generateRingtoneAudio } from '@/utils/generateRingtones';

interface FakeCallProps {
  isActive: boolean;
  onEnd: () => void;
  callerName?: string;
  callerNumber?: string;
  ringtone?: 'classic' | 'modern';
}

const FakeCall: React.FC<FakeCallProps> = ({
  isActive,
  onEnd,
  callerName = "Mom",
  callerNumber = "+1 (555) 123-4567",
  ringtone = "classic",
}) => {
  const [callState, setCallState] = useState<'ringing' | 'answered' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCallState('ringing');
      setCallDuration(0);
      return;
    }

    if (callState === 'ringing') {
      try {
        const audioUrl = generateRingtoneAudio(ringtone);
        const ringtoneAudio = new Audio(audioUrl);
        ringtoneAudio.loop = true;
        ringtoneAudio.volume = 0.8;
        audioRef.current = ringtoneAudio;
        
        ringtoneAudio.play().catch(() => {
          console.log('Audio playback failed, using vibration only');
        });
      } catch (e) {
        console.log('Could not generate ringtone');
      }

      const vibrateInterval = setInterval(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 200, 500, 200]);
        }
      }, 2000);

      return () => {
        clearInterval(vibrateInterval);
        navigator.vibrate?.(0);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }
  }, [isActive, callState, ringtone]);

  useEffect(() => {
    if (callState !== 'ringing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [callState]);

  useEffect(() => {
    if (callState === 'answered') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = useCallback(() => {
    setCallState('answered');
    navigator.vibrate?.(0);
  }, []);

  const handleDecline = useCallback(() => {
    setCallState('ended');
    navigator.vibrate?.(0);
    onEnd();
  }, [onEnd]);

  const handleHangUp = useCallback(() => {
    setCallState('ended');
    onEnd();
  }, [onEnd]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-muted flex flex-col items-center justify-between p-8">
      <div className="flex flex-col items-center pt-16">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
          <span className="text-4xl font-semibold text-primary-foreground">
            {callerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">{callerName}</h1>
        <p className="text-lg text-muted-foreground">{callerNumber}</p>
        
        {callState === 'ringing' && (
          <p className="text-sm text-muted-foreground mt-4 animate-pulse">Incoming call...</p>
        )}
        
        {callState === 'answered' && (
          <p className="text-sm text-muted-foreground mt-4">{formatDuration(callDuration)}</p>
        )}
      </div>

      <div className="flex-1" />

      <div className="w-full max-w-sm pb-12">
        {callState === 'ringing' ? (
          <div className="flex justify-center gap-16">
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-8 h-8 text-destructive-foreground" />
            </button>
            
            <button
              onClick={handleAnswer}
              className="w-16 h-16 rounded-full bg-success flex items-center justify-center active:scale-95 transition-transform animate-pulse"
            >
              <Phone className="w-8 h-8 text-success-foreground" />
            </button>
          </div>
        ) : callState === 'answered' ? (
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3 bg-muted rounded-full px-6 py-3">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
              <span className="text-foreground text-sm">Call in progress</span>
            </div>
            
            <button
              onClick={handleHangUp}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center active:scale-95 transition-transform"
            >
              <Phone className="w-8 h-8 text-destructive-foreground rotate-[135deg]" />
            </button>
          </div>
        ) : null}
      </div>

      {callState === 'ringing' && (
        <p className="text-muted-foreground text-xs pb-4">
          Tap to answer or decline
        </p>
      )}
    </div>
  );
};

export default FakeCall;