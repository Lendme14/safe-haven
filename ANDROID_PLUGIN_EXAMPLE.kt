/**
 * Android Native Audio Recording Plugin
 * 
 * This file contains the native Android implementation for advanced audio recording features.
 * Place this in: android/app/src/main/java/com/mettaloid/sentri/
 * 
 * File: AudioRecorderPlugin.kt
 */

package com.mettaloid.sentri

import android.Manifest
import android.content.Context
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import androidx.core.app.ActivityCompat
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.getcapacitor.CapacitorPlugin
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.JSObject
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

/**
 * Audio Recording Plugin for Capacitor
 * Provides native audio recording with proper lifecycle management
 */
@CapacitorPlugin(
    name = "AudioRecorder",
    permissions = [
        Permission(
            alias = "microphone",
            strings = [Manifest.permission.RECORD_AUDIO, Manifest.permission.WRITE_EXTERNAL_STORAGE]
        )
    ]
)
class AudioRecorderPlugin : Plugin() {
    
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private var audioFile: File? = null
    private val audioOutputDir: String
        get() = context.getExternalFilesDir("audio")?.absolutePath ?: context.cacheDir.absolutePath

    override fun load() {
        super.load()
        setupAudioDirectory()
    }

    /**
     * Initialize audio recording
     */
    @PluginMethod
    fun initRecording(call: PluginCall) {
        if (isRecording) {
            call.reject("Already recording")
            return
        }

        // Check and request permissions
        if (!hasPermission(Manifest.permission.RECORD_AUDIO)) {
            requestPermissionForAlias("microphone", call, "initRecordingPerms")
            return
        }

        initRecordingPerms(call)
    }

    @PermissionCallback
    private fun initRecordingPerms(call: PluginCall) {
        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "recording_$timestamp.m4a"
            audioFile = File(audioOutputDir, filename)

            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
                setOutputFile(audioFile?.absolutePath)
                prepare()
                start()
            }

            isRecording = true
            val result = JSObject()
            result.put("success", true)
            result.put("file", audioFile?.absolutePath)
            call.resolve(result)

        } catch (e: IOException) {
            call.reject("Failed to initialize recording: ${e.message}")
            cleanup()
        }
    }

    /**
     * Stop recording
     */
    @PluginMethod
    fun stopRecording(call: PluginCall) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("No active recording")
            return
        }

        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            isRecording = false

            val result = JSObject()
            result.put("success", true)
            result.put("file", audioFile?.absolutePath)
            result.put("fileSize", audioFile?.length() ?: 0L)
            call.resolve(result)

        } catch (e: RuntimeException) {
            call.reject("Failed to stop recording: ${e.message}")
            cleanup()
        }
    }

    /**
     * Pause recording
     */
    @PluginMethod
    fun pauseRecording(call: PluginCall) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("No active recording")
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                mediaRecorder?.pause()
                val result = JSObject()
                result.put("success", true)
                call.resolve(result)
            } else {
                call.reject("Pause not supported on this Android version")
            }
        } catch (e: Exception) {
            call.reject("Failed to pause recording: ${e.message}")
        }
    }

    /**
     * Resume recording
     */
    @PluginMethod
    fun resumeRecording(call: PluginCall) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("No active recording")
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                mediaRecorder?.resume()
                val result = JSObject()
                result.put("success", true)
                call.resolve(result)
            } else {
                call.reject("Resume not supported on this Android version")
            }
        } catch (e: Exception) {
            call.reject("Failed to resume recording: ${e.message}")
        }
    }

    /**
     * Get current audio level
     */
    @PluginMethod
    fun getAudioLevel(call: PluginCall) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("No active recording")
            return
        }

        try {
            // MediaRecorder.maxAmplitude returns 0-32767
            val level = mediaRecorder?.maxAmplitude ?: 0
            val normalizedLevel = (level / 32767.0 * 100).toInt()

            val result = JSObject()
            result.put("level", normalizedLevel)
            result.put("amplitude", level)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to get audio level: ${e.message}")
        }
    }

    /**
     * Set audio output route
     */
    @PluginMethod
    fun setAudioOutput(call: PluginCall) {
        val output = call.getString("output") ?: "speaker"
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        try {
            when (output.lowercase()) {
                "speaker" -> {
                    audioManager.mode = AudioManager.MODE_NORMAL
                    audioManager.isSpeakerphoneOn = true
                }
                "receiver" -> {
                    audioManager.isSpeakerphoneOn = false
                    audioManager.mode = AudioManager.MODE_NORMAL
                }
                else -> {
                    call.reject("Invalid audio output: $output")
                    return
                }
            }

            val result = JSObject()
            result.put("success", true)
            result.put("output", output)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to set audio output: ${e.message}")
        }
    }

    /**
     * Get recording metadata
     */
    @PluginMethod
    fun getRecordingInfo(call: PluginCall) {
        val result = JSObject()
        result.put("isRecording", isRecording)
        result.put("file", audioFile?.absolutePath ?: "")
        result.put("fileSize", audioFile?.length() ?: 0L)
        call.resolve(result)
    }

    /**
     * Delete recording file
     */
    @PluginMethod
    fun deleteRecording(call: PluginCall) {
        val filePath = call.getString("file")
        if (filePath.isNullOrEmpty()) {
            call.reject("No file path provided")
            return
        }

        try {
            val file = File(filePath)
            val deleted = file.delete()

            val result = JSObject()
            result.put("success", deleted)
            call.resolve(result)

        } catch (e: Exception) {
            call.reject("Failed to delete file: ${e.message}")
        }
    }

    /**
     * Setup audio directory
     */
    private fun setupAudioDirectory() {
        val dir = File(audioOutputDir)
        if (!dir.exists()) {
            dir.mkdirs()
        }
    }

    /**
     * Cleanup resources
     */
    private fun cleanup() {
        try {
            mediaRecorder?.release()
            mediaRecorder = null
            isRecording = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun handleOnDestroy() {
        cleanup()
        super.handleOnDestroy()
    }
}

/**
 * Note: Register this plugin in MainActivity.kt:
 *
 * import com.mettaloid.sentri.AudioRecorderPlugin
 *
 * public class MainActivity extends BridgeActivity {
 *   @Override
 *   public void onCreate(Bundle savedInstanceState) {
 *     super.onCreate(savedInstanceState);
 *
 *     // Initializing the plugin.
 *     this.init(savedInstanceState, new Class[]{
 *       AudioRecorderPlugin.class
 *     });
 *   }
 * }
 */
