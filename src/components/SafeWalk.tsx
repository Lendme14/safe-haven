import React, { useState } from 'react';
import { Navigation, MapPin, Clock, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useSafety } from '@/contexts/SafetyContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SafeWalk: React.FC = () => {
  const { 
    isSafeWalkActive, 
    safeWalkDestination, 
    safeWalkRemainingTime,
    startSafeWalk, 
    endSafeWalk 
  } = useSafety();
  
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [etaMinutes, setEtaMinutes] = useState(15);

  const handleStart = async () => {
    if (!destination.trim()) return;
    await startSafeWalk(destination, etaMinutes);
    setIsOpen(false);
    setDestination('');
  };

  const handleArrive = async () => {
    await endSafeWalk();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSafeWalkActive) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Safe Walk Active</p>
                <p className="text-xs text-muted-foreground">Sharing location with contacts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatTime(safeWalkRemainingTime)}</p>
              <p className="text-xs text-muted-foreground">ETA remaining</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 p-3 bg-background/50 rounded-xl">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">{safeWalkDestination}</span>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleArrive} 
              className="flex-1 bg-success hover:bg-success/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Arrived
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={endSafeWalk}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 justify-start gap-4 border-2 border-dashed hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">Safe Walk</p>
            <p className="text-xs text-muted-foreground">Share your journey with contacts</p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Start Safe Walk
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Where are you going?</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Estimated arrival time</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setEtaMinutes(mins)}
                  className={cn(
                    "py-3 px-3 rounded-xl text-sm font-medium transition-all",
                    etaMinutes === mins 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Custom:</label>
              <Input
                type="number"
                min="1"
                max="180"
                value={etaMinutes}
                onChange={(e) => setEtaMinutes(parseInt(e.target.value) || 15)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <div className="w-2 h-2 bg-success rounded-full" />
              Your location will be shared continuously
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <div className="w-2 h-2 bg-warning rounded-full" />
              Contacts alerted if you don't arrive on time
            </div>
          </div>

          <Button 
            onClick={handleStart} 
            className="w-full"
            disabled={!destination.trim()}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Start Safe Walk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafeWalk;
