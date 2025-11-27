'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ListItemButton,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
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

function FriendsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  // Set tab based on query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests') {
      setTab(1);
    } else if (tabParam === 'pending') {
      setTab(2);
    } else {
      setTab(0);
    }
  }, [searchParams]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Get accepted friends where user_id = user.id
      const { data: friendsData1 } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Get accepted friends where friend_id = user.id
      const { data: friendsData2 } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      // Get pending requests I sent
      const { data: pendingData } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Get pending requests I received
      const { data: requestsData } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Fetch profiles for all friend IDs
      const allFriendIds = new Set<string>();
      
      // Collect friend IDs from first set
      friendsData1?.forEach((f) => allFriendIds.add(f.friend_id));
      // Collect friend IDs from second set
      friendsData2?.forEach((f) => allFriendIds.add(f.user_id));
      // Collect friend IDs from pending (outgoing)
      pendingData?.forEach((f) => allFriendIds.add(f.friend_id));
      // Collect friend IDs from requests (incoming)
      requestsData?.forEach((f) => allFriendIds.add(f.user_id));

      // Fetch all profiles at once
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(allFriendIds));

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map((profile: any) => [profile.id, profile])
      );

      // Attach profiles to friends data
      const friendsWithProfiles1 = (friendsData1 || []).map((f: any) => ({
        ...f,
        profiles: profilesMap.get(f.friend_id) || { id: f.friend_id, display_name: null, avatar_url: null },
      }));

      const friendsWithProfiles2 = (friendsData2 || []).map((f: any) => ({
        ...f,
        profiles: profilesMap.get(f.user_id) || { id: f.user_id, display_name: null, avatar_url: null },
      }));

      const pendingWithProfiles = (pendingData || []).map((f: any) => ({
        ...f,
        profiles: profilesMap.get(f.friend_id) || { id: f.friend_id, display_name: null, avatar_url: null },
      }));

      const requestsWithProfiles = (requestsData || []).map((f: any) => ({
        ...f,
        profiles: profilesMap.get(f.user_id) || { id: f.user_id, display_name: null, avatar_url: null },
      }));

      setFriends([...friendsWithProfiles1, ...friendsWithProfiles2]);
      setPending(pendingWithProfiles);
      setRequests(requestsWithProfiles);
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
      
      // Trigger custom event to update sidebar
      window.dispatchEvent(new CustomEvent('friendsUpdated'));
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
      window.dispatchEvent(new CustomEvent('friendsUpdated'));
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      setAnchorEl(null);
      setSelectedPendingId(null);
      fetchFriends();
      window.dispatchEvent(new CustomEvent('friendsUpdated'));
    } catch (error) {
      console.error('Error canceling request:', error);
      alert('Failed to cancel request');
    }
  };

  const handlePendingChipClick = (event: React.MouseEvent<HTMLElement>, friendshipId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPendingId(friendshipId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPendingId(null);
  };

  const handleUnfriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      fetchFriends();
      window.dispatchEvent(new CustomEvent('friendsUpdated'));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
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
              <UserSearch onRequestSent={fetchFriends} onRequestCanceled={fetchFriends} />
            </Paper>

            <Paper sx={{ mt: 2 }}>
              <Tabs 
                value={tab} 
                onChange={(_, v) => setTab(v)}
                sx={{ 
                  px: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                  }
                }}
              >
                <Tab label={`All (${friends.length})`} />
                <Tab label={`Requests (${requests.length})`} />
                <Tab label={`Pending (${pending.length})`} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tab === 0 && (
                  <List>
                    {friends.map((friend) => (
                      <ListItem
                        key={friend.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleUnfriend(friend.id)}
                            size="small"
                            sx={{ color: 'grey.400' }}
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                        }
                        disablePadding
                      >
                        <ListItemButton onClick={() => router.push(`/profile/${friend.profiles.id}`)}>
                          <ListItemAvatar>
                            <Avatar src={friend.profiles.avatar_url || undefined}>
                              {friend.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={friend.profiles.display_name || 'Unknown'}
                          />
                          <Chip label="Friend" color="primary" size="small" sx={{ ml: 2 }} />
                        </ListItemButton>
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
                      <ListItem
                        key={request.id}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              startIcon={<CheckIcon />}
                              variant="contained"
                              size="small"
                              onClick={() => handleAcceptRequest(request.id)}
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
                          </Box>
                        }
                        disablePadding
                      >
                        <ListItemButton onClick={() => router.push(`/profile/${request.profiles.id}`)}>
                          <ListItemAvatar>
                            <Avatar src={request.profiles.avatar_url || undefined}>
                              {request.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.profiles.display_name || 'Unknown'}
                            secondary="Wants to be your friend"
                          />
                        </ListItemButton>
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
                  <>
                    <List>
                      {pending.map((pendingFriend) => (
                        <ListItem
                          key={pendingFriend.id}
                          disablePadding
                        >
                          <ListItemButton onClick={() => router.push(`/profile/${pendingFriend.profiles.id}`)}>
                            <ListItemAvatar>
                              <Avatar src={pendingFriend.profiles.avatar_url || undefined}>
                                {pendingFriend.profiles.display_name?.[0]?.toUpperCase() || 'U'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={pendingFriend.profiles.display_name || 'Unknown'}
                              secondary="Request sent"
                            />
                            <Chip 
                              label="Pending" 
                              size="small" 
                              sx={{ ml: 2, cursor: 'pointer' }}
                              onClick={(e) => handlePendingChipClick(e, pendingFriend.id)}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                      {pending.length === 0 && (
                        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                          No pending requests
                        </Typography>
                      )}
                    </List>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem 
                        onClick={() => selectedPendingId && handleCancelRequest(selectedPendingId)}
                        sx={{ color: 'error.main', fontSize: '0.875rem' }}
                      >
                        <CloseIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        Cancel Request
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Paper>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Friends
            </Typography>
            <Typography color="text.secondary">Loading...</Typography>
          </Container>
        </PageLayout>
      </ProtectedRoute>
    }>
      <FriendsPageContent />
    </Suspense>
  );
}

