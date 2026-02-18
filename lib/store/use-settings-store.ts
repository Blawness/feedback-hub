import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationsEnabled: false,
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
        }),
        {
            name: 'feedback-hub-settings',
        }
    )
);
