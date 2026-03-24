"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  useCall,
  useCallStateHooks,
  CallingState,
} from "@stream-io/video-react-sdk";
import { useStreamContext } from "./StreamProvider";
import styles from "./ScreenRecorder.module.css";

type RecordingState = "idle" | "starting" | "recording" | "stopping";

export function ScreenRecorder() {
  const { client, userName, userImage } = useStreamContext();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [call, setCall] = useState<ReturnType<
    NonNullable<typeof client>["call"]
  > | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showViewerPanel, setShowViewerPanel] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [viewerCall, setViewerCall] = useState<ReturnType<
    NonNullable<typeof client>["call"]
  > | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const viewerScreenRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!client) return;
    setRecordingState("starting");

    try {
      // Capture screen
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });
      setScreenStream(screen);

      // Capture camera (optional - wrapped in try/catch)
      let camera: MediaStream | null = null;
      try {
        camera = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });
        setCameraStream(camera);
      } catch {
        console.log("Camera not available, continuing without camera");
      }

      // Show preview
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screen;
      }
      if (cameraVideoRef.current && camera) {
        cameraVideoRef.current.srcObject = camera;
      }

      // Create a Stream call for live streaming
      const callId = `recording-${Date.now()}`;
      const newCall = client.call("default", callId);
      await newCall.join({ create: true });

      // Publish screen share track
      if (screen.getVideoTracks().length > 0) {
        await newCall.publishScreenShareStream(screen);
      }

      // Start server-side recording
      try {
        await newCall.startRecording();
      } catch (err) {
        console.log("Server recording not available:", err);
      }

      setCall(newCall);
      setActiveCallId(callId);
      setRecordingState("recording");
      setElapsedTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Handle screen share stop (user clicks browser's "Stop sharing")
      screen.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopRecording();
      });
    } catch (err) {
      console.error("Failed to start recording:", err);
      setRecordingState("idle");
    }
  }, [client]);

  const stopRecording = useCallback(async () => {
    setRecordingState("stopping");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop all streams
    screenStream?.getTracks().forEach((track) => track.stop());
    cameraStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setCameraStream(null);

    // Stop recording and leave the call
    if (call) {
      try {
        await call.stopRecording();
      } catch {
        // Recording might not have been started
      }
      try {
        await call.leave();
      } catch {
        // Already left
      }
    }

    setCall(null);
    setActiveCallId(null);
    setRecordingState("idle");
    setElapsedTime(0);
  }, [call, screenStream, cameraStream]);

  // Watch a live recording from another user
  const watchRecording = useCallback(
    async (callId: string) => {
      if (!client) return;

      try {
        const watchCall = client.call("default", callId);
        await watchCall.join();
        setViewerCall(watchCall);
        setShowViewerPanel(true);
      } catch (err) {
        console.error("Failed to join recording:", err);
      }
    },
    [client]
  );

  const stopWatching = useCallback(async () => {
    if (viewerCall) {
      try {
        await viewerCall.leave();
      } catch {
        // Already left
      }
    }
    setViewerCall(null);
    setShowViewerPanel(false);
  }, [viewerCall]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {/* Recording Button */}
      {recordingState === "idle" && (
        <button
          className={styles.recordButton}
          onClick={startRecording}
          title="Start screen recording"
          disabled={!client}
        >
          <span className={styles.recordDot} />
          Record
        </button>
      )}

      {/* Recording in progress */}
      {recordingState === "recording" && (
        <div className={styles.recordingControls}>
          <span className={styles.recordingIndicator}>
            <span className={styles.recordDotActive} />
            REC {formatTime(elapsedTime)}
          </span>
          <button className={styles.stopButton} onClick={stopRecording}>
            Stop
          </button>
        </div>
      )}

      {/* Starting/Stopping states */}
      {(recordingState === "starting" || recordingState === "stopping") && (
        <div className={styles.recordingControls}>
          <span className={styles.loadingText}>
            {recordingState === "starting" ? "Starting..." : "Stopping..."}
          </span>
        </div>
      )}

      {/* Screen recording preview (shown when recording) */}
      {recordingState === "recording" && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              <div className={styles.previewHeaderLeft}>
                <span className={styles.recordDotActive} />
                <span>Recording - {formatTime(elapsedTime)}</span>
              </div>
              <button
                className={styles.previewClose}
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            </div>
            <div className={styles.previewContent}>
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className={styles.screenPreview}
              />
              {cameraStream && (
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.cameraBubble}
                />
              )}
            </div>
            <div className={styles.previewFooter}>
              <img
                src={userImage}
                alt={userName}
                className={styles.recorderAvatar}
              />
              <span className={styles.recorderName}>{userName}</span>
              <span className={styles.liveTag}>LIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Viewer panel for watching others' recordings */}
      {showViewerPanel && viewerCall && (
        <div className={styles.viewerOverlay}>
          <div className={styles.viewerContainer}>
            <div className={styles.viewerHeader}>
              <span className={styles.liveTag}>LIVE</span>
              <span>Watching screen recording</span>
              <button className={styles.previewClose} onClick={stopWatching}>
                Close
              </button>
            </div>
            <div className={styles.viewerContent}>
              <video
                ref={viewerScreenRef}
                autoPlay
                playsInline
                className={styles.screenPreview}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
