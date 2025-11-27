'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  Paper,
} from '@mui/material';
import { supabase } from '@/lib/supabase/client';

interface Friend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FriendsListProps {
  userId: string;
}

export default function FriendsList({ userId }: FriendsListProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    try {
      // Get friends where user_id = userId (user sent the request)
      const { data: friendsData1 } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      // Get friends where friend_id = userId (user received the request)
      const { data: friendsData2 } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      // Collect all friend IDs
      const allFriendIds = new Set<string>();
      friendsData1?.forEach((f) => allFriendIds.add(f.friend_id));
      friendsData2?.forEach((f) => allFriendIds.add(f.user_id));

      // Fetch all profiles at once
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(allFriendIds));

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map((profile: any) => [profile.id, profile])
      );

      // Build friends list from profiles
      const allFriends: Friend[] = [];
      allFriendIds.forEach((friendId) => {
        const profile = profilesMap.get(friendId);
        if (profile) {
          allFriends.push({
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          });
        }
      });

      setFriends(allFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading friends...</Typography>
      </Box>
    );
  }

  if (friends.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No friends yet</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2}>
        {friends.map((friend) => (
          <Grid item xs={6} sm={4} md={3} key={friend.id}>
            <Paper
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                textAlign: 'center',
              }}
              onClick={() => router.push(`/profile/${friend.id}`)}
            >
              <Avatar
                src={friend.avatar_url || undefined}
                sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
              >
                {friend.display_name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography 
                variant="body2" 
                noWrap
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main'
                }}
              >
                {friend.display_name || 'Unknown'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

