import React, { useState, useEffect, useCallback } from 'react';
import { Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FakeCallProps {
  isActive: boolean;
  onEnd: () => void;
  callerName?: string;
  callerNumber?: string;
}

const FakeCall: React.FC<FakeCallProps> = ({
  isActive,
  onEnd,
  callerName = "Mom",
  callerNumber = "+1 (555) 123-4567",
}) => {
  const [callState, setCallState] = useState<'ringing' | 'answered' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCallState('ringing');
      setCallDuration(0);
      return;
    }

    // Start vibration pattern for ringing (if available)
    if ('vibrate' in navigator && callState === 'ringing') {
      const vibrateInterval = setInterval(() => {
        navigator.vibrate([500, 200, 500, 200]);
      }, 2000);

      return () => {
        clearInterval(vibrateInterval);
        navigator.vibrate(0);
      };
    }
  }, [isActive, callState]);

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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between p-8">
      {/* Top section - Caller info */}
      <div className="flex flex-col items-center pt-16">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
          <span className="text-4xl font-semibold text-white">
            {callerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-white mb-2">{callerName}</h1>
        <p className="text-lg text-gray-400">{callerNumber}</p>
        
        {callState === 'ringing' && (
          <p className="text-sm text-gray-500 mt-4 animate-pulse">Incoming call...</p>
        )}
        
        {callState === 'answered' && (
          <p className="text-sm text-gray-400 mt-4">{formatDuration(callDuration)}</p>
        )}
      </div>

      {/* Middle section - spacer */}
      <div className="flex-1" />

      {/* Bottom section - Call controls */}
      <div className="w-full max-w-sm pb-12">
        {callState === 'ringing' ? (
          <div className="flex justify-center gap-16">
            {/* Decline button */}
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-8 h-8 text-white" />
            </button>
            
            {/* Answer button */}
            <button
              onClick={handleAnswer}
              className="w-16 h-16 rounded-full bg-success flex items-center justify-center active:scale-95 transition-transform animate-pulse"
            >
              <Phone className="w-8 h-8 text-white" />
            </button>
          </div>
        ) : callState === 'answered' ? (
          <div className="flex flex-col items-center gap-8">
            {/* In-call indicator */}
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
              <span className="text-white text-sm">Call in progress</span>
            </div>
            
            {/* End call button */}
            <button
              onClick={handleHangUp}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center active:scale-95 transition-transform"
            >
              <Phone className="w-8 h-8 text-white rotate-[135deg]" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Swipe hint for ringing state */}
      {callState === 'ringing' && (
        <p className="text-gray-600 text-xs pb-4">
          Tap to answer or decline
        </p>
      )}
    </div>
  );
};

export default FakeCall;
