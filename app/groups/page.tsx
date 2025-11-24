'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';

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

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPublic, setNewGroupPublic] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    try {
      // Get public groups and groups I'm a member of
      const { data: allGroups } = await supabase
        .from('groups')
        .select('*')
        .or(`is_public.eq.true,owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Get my groups
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const myGroupIds = new Set(myMemberships?.map((m) => m.group_id) || []);
      const myGroupsData = (allGroups || []).filter((g) =>
        myGroupIds.has(g.id) || g.owner_id === user.id
      );

      // Get member counts
      const groupsWithCounts = await Promise.all(
        (allGroups || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('status', 'accepted');

          const membership = myMemberships?.find((m) => m.group_id === group.id);

          return {
            ...group,
            member_count: (count || 0) + 1, // +1 for owner
            user_role: membership?.role,
            user_status: membership?.status || (group.owner_id === user.id ? 'accepted' : null),
          };
        })
      );

      setGroups(groupsWithCounts);
      setMyGroups(myGroupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user, fetchGroups]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      console.log('Creating group with data:', {
        name: newGroupName,
        description: newGroupDescription,
        owner_id: user.id,
        is_public: newGroupPublic,
      });

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription || null,
          owner_id: user.id,
          is_public: newGroupPublic,
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group - full error object:', groupError);
        console.error('Error message:', groupError.message);
        console.error('Error details:', groupError.details);
        console.error('Error hint:', groupError.hint);
        console.error('Error code:', groupError.code);
        console.error('Error stringified:', JSON.stringify(groupError, null, 2));
        throw groupError;
      }

      if (!group) {
        throw new Error('Group was created but no data returned');
      }

      console.log('Group created successfully:', group);

      // Add owner as member
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
        status: 'accepted',
      });

      if (memberError) {
        console.error('Error adding owner as member - full error:', memberError);
        console.error('Member error message:', memberError.message);
        console.error('Member error details:', memberError.details);
        // If adding member fails, we should still try to continue
        // The group was created successfully, the member can be added manually if needed
        console.warn('Group created but owner member not added. Group ID:', group.id);
      } else {
        console.log('Owner added as member successfully');
      }

      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupPublic(true);
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group - catch block:');
      console.error('Error type:', typeof error);
      console.error('Error value:', error);
      console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Error code:', error?.code);
      
      const errorMessage = 
        error?.message || 
        error?.details || 
        error?.hint || 
        (typeof error === 'string' ? error : 'Failed to create group');
      alert(`Failed to create group: ${errorMessage}`);
    }
  };

  const handleJoinRequest = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        status: 'pending',
      });

      if (error) throw error;
      fetchGroups();
    } catch (error) {
      console.error('Error requesting to join:', error);
      alert('Failed to send join request');
    }
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h4">Groups</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Group
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              My Groups
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {myGroups.map((group) => (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  <Card>
                    <CardMedia>
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {group.avatar_url ? (
                          <Image
                            src={group.avatar_url}
                            alt={group.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <GroupIcon sx={{ fontSize: 60, color: 'white' }} />
                        )}
                      </Box>
                    </CardMedia>
                    <CardContent>
                      <Typography variant="h6">{group.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {group.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip label={`${group.member_count || 0} members`} size="small" />
                        {group.user_role && (
                          <Chip label={group.user_role} size="small" color="primary" />
                        )}
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          router.push(`/groups/${group.id}`);
                        }}
                      >
                        View Group
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom>
              Discover Groups
            </Typography>
            <Grid container spacing={2}>
              {groups
                .filter((g) => !myGroups.find((mg) => mg.id === g.id))
                .map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    <Card>
                      <CardMedia>
                        <Box
                          sx={{
                            height: 140,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          {group.avatar_url ? (
                            <Image
                              src={group.avatar_url}
                              alt={group.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <GroupIcon sx={{ fontSize: 60, color: 'white' }} />
                          )}
                        </Box>
                      </CardMedia>
                      <CardContent>
                        <Typography variant="h6">{group.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {group.description || 'No description'}
                        </Typography>
                        <Chip
                          label={`${group.member_count || 0} members`}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        {group.user_status === 'pending' ? (
                          <Chip label="Request Pending" color="warning" sx={{ width: '100%' }} />
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleJoinRequest(group.id)}
                          >
                            Request to Join
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  multiline
                  rows={3}
                  margin="normal"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={newGroupPublic}
                      onChange={(e) => setNewGroupPublic(e.target.checked)}
                    />
                  }
                  label="Public Group"
                  sx={{ mt: 2 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateGroup}
                  variant="contained"
                  disabled={!newGroupName.trim()}
                >
                  Create
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

