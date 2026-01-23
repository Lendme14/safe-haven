import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Share2, 
  Download, 
  Mic, 
  Clock,
  Headphones,
  Volume2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  file_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  created_at: string;
  safety_event_id: string;
}

const Playback: React.FC = () => {
  const { user, loading } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      // Cleanup audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const fetchRecordings = async () => {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
    } else {
      setRecordings(data || []);
    }
    setIsLoading(false);
  };

  const loadRecording = async (recording: Recording) => {
    setSelectedRecording(recording);
    setIsPlaying(false);
    setCurrentTime(0);

    try {
      const { data, error } = await supabase.storage
        .from('recordings')
        .download(recording.file_url);

      if (error) {
        console.error('Error downloading recording:', error);
        toast({
          title: "Error",
          description: "Could not load recording.",
          variant: "destructive",
        });
        return;
      }

      // Revoke previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const url = URL.createObjectURL(data);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    } catch (error) {
      console.error('Error loading recording:', error);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const handleShare = async () => {
    if (!selectedRecording || !audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `sentri-recording-${selectedRecording.id.slice(0, 8)}.webm`, {
        type: blob.type,
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Sentri Recording',
          text: `Safety recording from ${format(new Date(selectedRecording.created_at), 'MMM d, yyyy')}`,
          files: [file],
        });
      } else {
        // Fallback: Download the file
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `sentri-recording-${selectedRecording.id.slice(0, 8)}.webm`;
        a.click();
        toast({
          title: "Downloaded",
          description: "Recording saved to your device.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share failed",
        description: "Could not share the recording.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!selectedRecording || !audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `sentri-recording-${format(new Date(selectedRecording.created_at), 'yyyy-MM-dd-HHmm')}.webm`;
    a.click();

    toast({
      title: "Downloaded",
      description: "Recording saved to your device.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Playback</h1>
          <p className="text-sm text-muted-foreground mt-1">Listen to your safety recordings</p>
        </header>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Player */}
        {selectedRecording && (
          <div className="px-6 pb-6 slide-up">
            <Card className="glass-card">
              <CardContent className="p-6">
                {/* Waveform Visualization (Placeholder) */}
                <div className="flex items-center justify-center h-24 mb-6">
                  <div className="flex items-end gap-1 h-full">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 rounded-full transition-all duration-150",
                          isPlaying ? "bg-primary" : "bg-muted-foreground/30",
                          isPlaying && "animate-pulse"
                        )}
                        style={{
                          height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-6">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBack}
                    className="w-12 h-12 rounded-full"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full safety-gradient shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    className="w-12 h-12 rounded-full"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Recording Info */}
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(selectedRecording.created_at), 'MMMM d, yyyy • h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedRecording.file_size_bytes)} • 
                    {selectedRecording.duration_seconds ? ` ${formatTime(selectedRecording.duration_seconds)}` : ' Recording'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recordings List */}
        <div className="px-6 pb-6 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recordings</h2>
            <span className="text-sm text-muted-foreground">{recordings.length} total</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading recordings...</div>
            ) : recordings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">No recordings yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Audio recordings from Safety Mode will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              recordings.map((recording) => (
                <Card
                  key={recording.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    selectedRecording?.id === recording.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => loadRecording(recording)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        selectedRecording?.id === recording.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        {selectedRecording?.id === recording.id && isPlaying ? (
                          <Volume2 className="w-5 h-5 animate-pulse" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          Recording
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recording.duration_seconds 
                              ? formatTime(recording.duration_seconds)
                              : 'Unknown'
                            }
                          </span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadRecording(recording);
                          setTimeout(togglePlayPause, 500);
                        }}
                      >
                        {selectedRecording?.id === recording.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playback;
