"use client";

import { useEffect, useRef } from "react";
import { getLatestFeedbackInfo } from "@/lib/actions/feedback";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/store/use-settings-store";

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function NotificationListener() {
    const { notificationsEnabled } = useSettingsStore();
    const lastFeedbackIdRef = useRef<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize last seen ID from localStorage if exists
        const lastId = localStorage.getItem("last_feedback_id");
        lastFeedbackIdRef.current = lastId;

        // Create audio element
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }, []);

    useEffect(() => {
        if (!notificationsEnabled) return;

        const checkNewFeedback = async () => {
            try {
                const latest = await getLatestFeedbackInfo();
                if (!latest) return;

                // Sync initial ID if it's the first run
                if (!lastFeedbackIdRef.current) {
                    lastFeedbackIdRef.current = latest.id;
                    localStorage.setItem("last_feedback_id", latest.id);
                    return;
                }

                // If we found a NEW feedback ID
                if (latest.id !== lastFeedbackIdRef.current) {
                    // Update storage and ref
                    lastFeedbackIdRef.current = latest.id;
                    localStorage.setItem("last_feedback_id", latest.id);

                    // Play sound
                    if (audioRef.current) {
                        audioRef.current.play().catch(err => {
                            console.warn("Audio playback failed (usually needs user interaction first):", err);
                        });
                    }

                    // Show toast
                    toast.info("New Feedback Received", {
                        description: latest.title,
                        duration: 5000,
                    });
                }
            } catch (error) {
                console.error("Failed to poll for new feedback:", error);
            }
        };

        // Poll every 15 seconds
        const interval = setInterval(checkNewFeedback, 15000);

        // Immediate check on mount/enable
        checkNewFeedback();

        return () => clearInterval(interval);
    }, [notificationsEnabled]);

    return null; // This is a logic-only component
}
