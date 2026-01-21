import React, { useState } from 'react';
import { Clock, Play, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSafety } from '@/contexts/SafetyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CheckInTimer: React.FC = () => {
  const { 
    isTimerActive, 
    remainingTime, 
    timerDuration,
    startCheckInTimer, 
    cancelCheckInTimer, 
    checkIn 
  } = useSafety();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [activeTab, setActiveTab] = useState('preset');

  const durations = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (activeTab === 'custom') {
      const totalMinutes = (customHours * 60) + customMinutes;
      if (totalMinutes > 0) {
        startCheckInTimer(totalMinutes);
      }
    } else {
      startCheckInTimer(selectedDuration);
    }
    setIsDialogOpen(false);
  };

  const isCustomValid = customHours > 0 || customMinutes > 0;

  const progress = isTimerActive && timerDuration > 0 
    ? (remainingTime / (timerDuration * 60)) * 100 
    : 0;

  if (isTimerActive) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Check-in Timer</p>
              <p className="text-xs text-muted-foreground">Check in before time runs out</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-warning transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer display */}
        <div className="text-center mb-4">
          <span className="text-4xl font-mono font-bold text-foreground">
            {formatTime(remainingTime)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={cancelCheckInTimer}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-success hover:bg-success/90"
            onClick={checkIn}
          >
            <Check className="w-4 h-4 mr-2" />
            I'm Safe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <Clock className="w-5 h-5" />
          <span>Start Check-in Timer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in Timer</DialogTitle>
          <DialogDescription>
            Set a timer. If you don't check in before it ends, your trusted contacts will be alerted automatically.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Preset</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preset" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Select duration:</p>
            <div className="grid grid-cols-2 gap-3">
              {durations.map((duration) => (
                <Button
                  key={duration.value}
                  variant={selectedDuration === duration.value ? "default" : "outline"}
                  onClick={() => setSelectedDuration(duration.value)}
                  className="h-12"
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Set custom duration:</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  max={23}
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="text-center text-lg"
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground mt-6">:</span>
              <div className="flex-1 space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0}
                  max={59}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-center text-lg"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Timer will run for {customHours > 0 ? `${customHours}h ` : ''}{customMinutes}m
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleStartTimer}
            disabled={activeTab === 'custom' && !isCustomValid}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Timer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInTimer;
