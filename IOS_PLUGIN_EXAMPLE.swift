/**
 * iOS Native Audio Recording Plugin
 * 
 * This file contains the native iOS implementation for advanced audio recording features.
 * Place this in: ios/App/App/Plugins/AudioRecorder/
 * 
 * File: AudioRecorderPlugin.swift
 */

import Foundation
import Capacitor
import AVFoundation

/**
 * Audio Recording Plugin for Capacitor (iOS)
 */
@objc(AudioRecorderPlugin)
public class AudioRecorderPlugin: CAPPlugin, AVAudioRecorderDelegate {
    
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var audioSession: AVAudioSession?
    private var isRecording = false
    private var recordingURL: URL?
    private var recordingTimer: Timer?
    private var recordingDuration = 0.0
    
    override public func load() {
        super.load()
        setupAudioSession()
    }
    
    /**
     * Initialize audio recording session
     */
    @objc func initRecording(_ call: CAPPluginCall) {
        // Request microphone permission
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            if granted {
                self.initRecordingImpl(call)
            } else {
                call.reject("Microphone permission denied")
            }
        }
    }
    
    /**
     * Internal recording initialization
     */
    private func initRecordingImpl(_ call: CAPPluginCall) {
        do {
            try audioSession?.setActive(true, options: .notifyOthersOnDeactivation)
            try audioSession?.setCategory(.record, mode: .default, options: [])
            
            // Generate file path
            let documentsPath = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            )[0]
            
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyyMMdd_HHmmss"
            let timestamp = formatter.string(from: Date())
            let filename = "recording_\(timestamp).m4a"
            recordingURL = documentsPath.appendingPathComponent(filename)
            
            // Setup audio recorder
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
                AVEncoderBitRateKey: 128000
            ]
            
            audioRecorder = try AVAudioRecorder(
                url: recordingURL!,
                settings: settings
            )
            audioRecorder?.delegate = self
            
            if audioRecorder?.prepareToRecord() ?? false {
                audioRecorder?.record()
                isRecording = true
                recordingDuration = 0.0
                startRecordingTimer()
                
                var result = JSObject()
                result.putString("success", "true")
                result.putString("file", recordingURL?.path ?? "")
                call.resolve(result)
            } else {
                call.reject("Failed to prepare audio recorder")
            }
            
        } catch let error as NSError {
            call.reject("Failed to initialize recording: \(error.localizedDescription)")
        }
    }
    
    /**
     * Stop recording
     */
    @objc func stopRecording(_ call: CAPPluginCall) {
        guard isRecording, let recorder = audioRecorder else {
            call.reject("No active recording")
            return
        }
        
        do {
            recorder.stop()
            try audioSession?.setActive(false, options: .notifyOthersOnDeactivation)
            isRecording = false
            stopRecordingTimer()
            
            let fileAttributes = try FileManager.default.attributesOfItem(
                atPath: recordingURL?.path ?? ""
            )
            let fileSize = fileAttributes[.size] as? NSNumber ?? 0
            
            var result = JSObject()
            result.putString("success", "true")
            result.putString("file", recordingURL?.path ?? "")
            result.putNumber("fileSize", fileSize)
            call.resolve(result)
            
        } catch let error as NSError {
            call.reject("Failed to stop recording: \(error.localizedDescription)")
        }
    }
    
    /**
     * Pause recording (iOS 10.0+)
     */
    @objc func pauseRecording(_ call: CAPPluginCall) {
        guard isRecording, let recorder = audioRecorder else {
            call.reject("No active recording")
            return
        }
        
        if #available(iOS 10.0, *) {
            recorder.pause()
            stopRecordingTimer()
            
            var result = JSObject()
            result.putString("success", "true")
            call.resolve(result)
        } else {
            call.reject("Pause not supported on this iOS version")
        }
    }
    
    /**
     * Resume recording (iOS 10.0+)
     */
    @objc func resumeRecording(_ call: CAPPluginCall) {
        guard isRecording, let recorder = audioRecorder else {
            call.reject("No active recording")
            return
        }
        
        if #available(iOS 10.0, *) {
            recorder.record()
            startRecordingTimer()
            
            var result = JSObject()
            result.putString("success", "true")
            call.resolve(result)
        } else {
            call.reject("Resume not supported on this iOS version")
        }
    }
    
    /**
     * Get audio level/peak power
     */
    @objc func getAudioLevel(_ call: CAPPluginCall) {
        guard isRecording, let recorder = audioRecorder else {
            call.reject("No active recording")
            return
        }
        
        recorder.updateMeters()
        
        // Get peak power for all channels (0 to -160 dB)
        let peakPower = recorder.peakPower(forChannel: 0)
        // Convert to 0-100 scale
        let normalizedLevel = max(0, min(100, Int((peakPower + 160) / 160 * 100)))
        
        var result = JSObject()
        result.putNumber("level", normalizedLevel)
        result.putNumber("peakPower", peakPower)
        call.resolve(result)
    }
    
    /**
     * Set audio output route
     */
    @objc func setAudioOutput(_ call: CAPPluginCall) {
        guard let output = call.getString("output") else {
            call.reject("No output specified")
            return
        }
        
        do {
            switch output.lowercased() {
            case "speaker":
                try audioSession?.setCategory(.playback, mode: .default, options: [.deferredDeactivationStrategy, .defaultToSpeaker])
                try audioSession?.setActive(true, options: .notifyOthersOnDeactivation)
                
            case "receiver":
                try audioSession?.setCategory(.playback, mode: .default, options: [.deferredDeactivationStrategy])
                try audioSession?.setActive(true, options: .notifyOthersOnDeactivation)
                
            default:
                call.reject("Invalid audio output: \(output)")
                return
            }
            
            var result = JSObject()
            result.putString("success", "true")
            result.putString("output", output)
            call.resolve(result)
            
        } catch let error as NSError {
            call.reject("Failed to set audio output: \(error.localizedDescription)")
        }
    }
    
    /**
     * Get recording information
     */
    @objc func getRecordingInfo(_ call: CAPPluginCall) {
        var result = JSObject()
        result.putBool("isRecording", isRecording)
        result.putString("file", recordingURL?.path ?? "")
        result.putNumber("duration", recordingDuration)
        
        if let url = recordingURL {
            do {
                let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
                result.putNumber("fileSize", (attributes[.size] as? NSNumber) ?? 0)
            } catch {
                result.putNumber("fileSize", 0)
            }
        }
        
        call.resolve(result)
    }
    
    /**
     * Delete recording file
     */
    @objc func deleteRecording(_ call: CAPPluginCall) {
        guard let filePath = call.getString("file") else {
            call.reject("No file path provided")
            return
        }
        
        do {
            try FileManager.default.removeItem(atPath: filePath)
            
            var result = JSObject()
            result.putBool("success", true)
            call.resolve(result)
            
        } catch let error as NSError {
            call.reject("Failed to delete file: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Private Methods
    
    /**
     * Setup audio session
     */
    private func setupAudioSession() {
        audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession?.setCategory(.record, mode: .default, options: [])
        } catch let error as NSError {
            print("Audio session error: \(error.localizedDescription)")
        }
    }
    
    /**
     * Start recording timer
     */
    private func startRecordingTimer() {
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.recordingDuration = self?.audioRecorder?.currentTime ?? 0.0
        }
    }
    
    /**
     * Stop recording timer
     */
    private func stopRecordingTimer() {
        recordingTimer?.invalidate()
        recordingTimer = nil
    }
    
    // MARK: - AVAudioRecorderDelegate
    
    public func audioRecorderDidFinishRecording(
        _ recorder: AVAudioRecorder,
        successfully flag: Bool
    ) {
        if !flag {
            print("Recording failed")
        }
        isRecording = false
        stopRecordingTimer()
    }
    
    public func audioRecorderEncodeErrorDidOccur(
        _ recorder: AVAudioRecorder,
        error: Error?
    ) {
        print("Recording encode error: \(error?.localizedDescription ?? "Unknown")")
    }
    
    override public func handleOnDestroy() {
        if isRecording {
            audioRecorder?.stop()
        }
        recordingTimer?.invalidate()
    }
}

/**
 * Note: Register this plugin in capacitor.config.ts:
 *
 * import type { CapacitorConfig } from '@capacitor/cli';
 *
 * const config: CapacitorConfig = {
 *   appId: 'com.mettaloid.sentri',
 *   appName: 'Sentri',
 *   webDir: 'dist',
 *   plugins: {
 *     AudioRecorder: {
 *       enabled: true,
 *     },
 *   },
 * };
 *
 * export default config;
 */
