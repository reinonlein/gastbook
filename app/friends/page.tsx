'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import UserSearch from '@/components/search/UserSearch';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Get accepted friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          *,
          profiles:friend_id (id, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const { data: friendsData2 } = await supabase
        .from('friends')
        .select(`
          *,
          profiles:user_id (id, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      // Get pending requests I sent
      const { data: pendingData } = await supabase
        .from('friends')
        .select(`
          *,
          profiles:friend_id (id, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Get pending requests I received
      const { data: requestsData } = await supabase
        .from('friends')
        .select(`
          *,
          profiles:user_id (id, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      setFriends([...(friendsData || []), ...(friendsData2 || [])]);
      setPending(pendingData || []);
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, fetchFriends]);

  const handleSendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('friends').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      fetchFriends();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Friends
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Search for users to add as friends
              </Typography>
              <UserSearch
                onUserSelect={(userId) => {
                  handleSendRequest(userId);
                }}
              />
            </Paper>

            <Paper sx={{ mt: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label={`All (${friends.length})`} />
                <Tab label={`Requests (${requests.length})`} />
                <Tab label={`Pending (${pending.length})`} />
              </Tabs>

              <Box sx={{ p: 2 }}>
                {tab === 0 && (
                  <List>
                    {friends.map((friend) => (
                      <ListItem key={friend.id}>
                        <ListItemAvatar>
                          <Avatar src={friend.profiles.avatar_url || undefined}>
                            {friend.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={friend.profiles.display_name || 'Unknown'}
                        />
                        <Chip label="Friend" color="primary" size="small" />
                      </ListItem>
                    ))}
                    {friends.length === 0 && (
                      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        No friends yet
                      </Typography>
                    )}
                  </List>
                )}

                {tab === 1 && (
                  <List>
                    {requests.map((request) => (
                      <ListItem key={request.id}>
                        <ListItemAvatar>
                          <Avatar src={request.profiles.avatar_url || undefined}>
                            {request.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={request.profiles.display_name || 'Unknown'}
                          secondary="Wants to be your friend"
                        />
                        <ListItemSecondaryAction>
                          <Button
                            startIcon={<CheckIcon />}
                            variant="contained"
                            size="small"
                            onClick={() => handleAcceptRequest(request.id)}
                            sx={{ mr: 1 }}
                          >
                            Accept
                          </Button>
                          <Button
                            startIcon={<CloseIcon />}
                            variant="outlined"
                            size="small"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {requests.length === 0 && (
                      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        No friend requests
                      </Typography>
                    )}
                  </List>
                )}

                {tab === 2 && (
                  <List>
                    {pending.map((pendingFriend) => (
                      <ListItem key={pendingFriend.id}>
                        <ListItemAvatar>
                          <Avatar src={pendingFriend.profiles.avatar_url || undefined}>
                            {pendingFriend.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={pendingFriend.profiles.display_name || 'Unknown'}
                          secondary="Request sent"
                        />
                        <Chip label="Pending" size="small" />
                      </ListItem>
                    ))}
                    {pending.length === 0 && (
                      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        No pending requests
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            </Paper>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

