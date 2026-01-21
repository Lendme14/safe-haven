// Generate ringtone audio using Web Audio API
export const generateRingtoneAudio = (type: 'classic' | 'modern'): string => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = type === 'classic' ? 1.5 : 2;
  const numSamples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  if (type === 'classic') {
    // Classic phone ring - dual tone like old phones
    const freq1 = 440; // A4
    const freq2 = 480; // B4 (slightly higher)
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Ring pattern: on for 0.4s, off for 0.2s, on for 0.4s, off for 0.5s
      const patternTime = t % duration;
      const isRinging = (patternTime < 0.4) || (patternTime >= 0.6 && patternTime < 1.0);
      
      if (isRinging) {
        const envelope = Math.min(1, Math.sin(Math.PI * (patternTime % 0.4) / 0.4));
        channelData[i] = envelope * 0.3 * (
          Math.sin(2 * Math.PI * freq1 * t) + 
          Math.sin(2 * Math.PI * freq2 * t)
        );
      } else {
        channelData[i] = 0;
      }
    }
  } else {
    // Modern melodic tone - ascending notes
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteLength = 0.25;
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const cycleTime = t % (notes.length * noteLength + 0.5);
      const noteIndex = Math.floor(cycleTime / noteLength);
      
      if (noteIndex < notes.length) {
        const noteTime = cycleTime - (noteIndex * noteLength);
        const envelope = Math.exp(-noteTime * 4) * Math.sin(Math.PI * noteTime / noteLength);
        channelData[i] = envelope * 0.4 * Math.sin(2 * Math.PI * notes[noteIndex] * t);
      } else {
        channelData[i] = 0;
      }
    }
  }

  // Convert to WAV
  return bufferToWav(buffer);
};

function bufferToWav(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}