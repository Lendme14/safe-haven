import React, { useState } from 'react';
import { Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FakeCall from './FakeCall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FakeCallButton: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [callerName, setCallerName] = useState('Mom');
  const [callerNumber, setCallerNumber] = useState('+1 (555) 123-4567');
  const [delay, setDelay] = useState('0');
  const [pendingCall, setPendingCall] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState<'classic' | 'modern'>('classic');

  const ringtones = [
    { id: 'classic' as const, name: 'Classic Ring', description: 'Traditional phone ring' },
    { id: 'modern' as const, name: 'Modern Tone', description: 'Soft melodic ringtone' },
  ];

  const presetContacts = [
    { name: 'Mom', number: '+1 (555) 123-4567' },
    { name: 'Dad', number: '+1 (555) 234-5678' },
    { name: 'Partner', number: '+1 (555) 345-6789' },
    { name: 'Best Friend', number: '+1 (555) 456-7890' },
    { name: 'Work', number: '+1 (555) 567-8901' },
  ];

  const handleStartCall = () => {
    const delaySeconds = parseInt(delay) || 0;
    
    if (delaySeconds > 0) {
      setPendingCall(true);
      setTimeout(() => {
        setPendingCall(false);
        setIsCallActive(true);
      }, delaySeconds * 1000);
    } else {
      setIsCallActive(true);
    }
    
    setIsSettingsOpen(false);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
  };

  const handlePresetSelect = (preset: typeof presetContacts[0]) => {
    setCallerName(preset.name);
    setCallerNumber(preset.number);
  };

  return (
    <>
      <FakeCall 
        isActive={isCallActive} 
        onEnd={handleEndCall}
        callerName={callerName}
        callerNumber={callerNumber}
        ringtone={selectedRingtone}
      />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
            disabled={pendingCall}
          >
            <Phone className="w-5 h-5" />
            <span>{pendingCall ? 'Call incoming...' : 'Fake Call'}</span>
            {pendingCall && (
              <span className="ml-auto text-xs text-muted-foreground animate-pulse">
                Ringing soon...
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fake Call</DialogTitle>
            <DialogDescription>
              Simulate an incoming phone call to help you exit uncomfortable situations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Preset contacts */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex flex-wrap gap-2">
                {presetContacts.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={callerName === preset.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom caller name */}
            <div className="space-y-2">
              <Label htmlFor="callerName">Caller Name</Label>
              <Input
                id="callerName"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Enter caller name"
              />
            </div>

            {/* Custom phone number */}
            <div className="space-y-2">
              <Label htmlFor="callerNumber">Phone Number</Label>
              <Input
                id="callerNumber"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Ringtone Selection */}
            <div className="space-y-2">
              <Label>Ringtone</Label>
              <div className="grid grid-cols-2 gap-2">
                {ringtones.map((tone) => (
                  <Button
                    key={tone.id}
                    variant={selectedRingtone === tone.id ? "default" : "outline"}
                    size="sm"
                    className="h-auto py-2 flex-col items-start"
                    onClick={() => setSelectedRingtone(tone.id)}
                  >
                    <span className="font-medium">{tone.name}</span>
                    <span className="text-xs opacity-70">{tone.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <Label>Call Delay</Label>
              <Select value={delay} onValueChange={setDelay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediately</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleStartCall}
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FakeCallButton;
