import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
    user_id: string;
    username: string;
    avatar_url?: string;
    online_at: string;
}

export function useCampfirePresence() {
    const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
    const { session, userProfile } = useStore();
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!session || !userProfile) return;

        const presenceChannel = supabase.channel('campfire-presence', {
            config: {
                presence: {
                    key: session.user.id,
                },
            },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const users: PresenceUser[] = [];

                Object.values(state).forEach((presences: any) => {
                    presences.forEach((presence: any) => {
                        users.push(presence);
                    });
                });

                setPresenceUsers(users);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('User joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('User left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Send initial presence
                    await presenceChannel.track({
                        user_id: session.user.id,
                        username: userProfile.username || 'Anonymous',
                        avatar_url: userProfile.avatar_url,
                        online_at: new Date().toISOString(),
                    });

                    // Send heartbeat every 30 seconds
                    const heartbeat = setInterval(async () => {
                        await presenceChannel.track({
                            user_id: session.user.id,
                            username: userProfile.username || 'Anonymous',
                            avatar_url: userProfile.avatar_url,
                            online_at: new Date().toISOString(),
                        });
                    }, 30000);

                    return () => clearInterval(heartbeat);
                }
            });

        setChannel(presenceChannel);

        return () => {
            presenceChannel.unsubscribe();
        };
    }, [session, userProfile]);

    return { presenceUsers, channel };
}
