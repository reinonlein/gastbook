'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Avatar,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import PostFeed from '@/components/posts/PostFeed';
import CreatePostDialog from '@/components/posts/CreatePostDialog';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  member_count?: number;
  user_role?: string;
  user_status?: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const fetchGroup = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'accepted');

      // Get user's membership status
      let userRole = null;
      let userStatus = null;
      if (user) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('role, status')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();

        userRole = membership?.role || null;
        userStatus = membership?.status || null;
        if (data.owner_id === user.id) {
          userRole = 'owner';
          userStatus = 'accepted';
        }
      }

      setGroup({
        ...data,
        member_count: (count || 0) + 1, // +1 for owner
        user_role: userRole,
        user_status: userStatus,
      });
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  const fetchMembers = useCallback(async () => {
    try {
      // First get the group to find owner_id
      const { data: groupData } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      const { data: membersData, error } = await supabase
        .from('group_members')
        .select('user_id, role, status, profiles:user_id(id, display_name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'accepted')
        .limit(10);

      if (error) throw error;

      // Also get owner profile
      if (groupData?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', groupData.owner_id)
          .single();

        if (ownerProfile) {
          setMembers([
            { user_id: ownerProfile.id, role: 'owner', profiles: ownerProfile },
            ...(membersData || []).filter((m) => m.user_id !== groupData.owner_id),
          ]);
        } else {
          setMembers(membersData || []);
        }
      } else {
        setMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId && user) {
      fetchGroup();
      fetchMembers();
    }
  }, [groupId, user, fetchGroup, fetchMembers]);

  const handleJoinRequest = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        status: 'pending',
      });

      if (error) throw error;
      fetchGroup();
    } catch (error) {
      console.error('Error requesting to join:', error);
      alert('Failed to send join request');
    }
  };

  const handlePostCreated = () => {
    // Posts will refresh automatically via PostFeed
    setCreatePostOpen(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          </Container>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography>Group not found</Typography>
          </Container>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  const canPost = group.user_status === 'accepted' || group.user_role === 'owner';

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/groups')}
            sx={{ mb: 2 }}
          >
            Back to Groups
          </Button>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Avatar
                  src={group.avatar_url || undefined}
                  sx={{ width: 120, height: 120 }}
                >
                  <GroupIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    {group.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {group.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={`${group.member_count || 0} members`} size="small" />
                    <Chip
                      label={group.is_public ? 'Public' : 'Private'}
                      size="small"
                      color={group.is_public ? 'primary' : 'default'}
                    />
                    {group.user_role && (
                      <Chip label={group.user_role} size="small" color="primary" />
                    )}
                    {group.user_status === 'pending' && (
                      <Chip label="Request Pending" color="warning" size="small" />
                    )}
                  </Box>
                  {!group.user_status && group.is_public && (
                    <Button
                      variant="contained"
                      onClick={handleJoinRequest}
                      startIcon={<AddIcon />}
                    >
                      Request to Join
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>

            {canPost && (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreatePostOpen(true)}
                  fullWidth
                >
                  Create Post in Group
                </Button>
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Group Posts
            </Typography>
            <PostFeed groupId={groupId} />

            <CreatePostDialog
              open={createPostOpen}
              onClose={() => setCreatePostOpen(false)}
              onPostCreated={handlePostCreated}
              groupId={groupId}
            />
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

