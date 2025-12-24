import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    subscription_tier: 'wanderer' | 'keeper' | 'lifer';
    current_streak: number;
    freeze_tokens: number;
}

interface AppState {
    session: Session | null;
    userProfile: UserProfile | null;
    setSession: (session: Session | null) => void;
    setUserProfile: (profile: UserProfile | null) => void;

    // App UI State
    isSoundOn: boolean;
    toggleSound: () => void;
}

export const useStore = create<AppState>((set) => ({
    session: null,
    userProfile: null,
    isSoundOn: true,
    setSession: (session) => set({ session }),
    setUserProfile: (userProfile) => set({ userProfile }),
    toggleSound: () => set((state) => ({ isSoundOn: !state.isSoundOn })),
}));
