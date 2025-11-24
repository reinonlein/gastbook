'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Avatar,
  Typography,
  Grid,
  Button,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import PostFeed from '@/components/posts/PostFeed';
import PhotoAlbums from '@/components/profile/PhotoAlbums';

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setDisplayName(data?.display_name || '');
      setBio(data?.bio || '');
      setAvatarPreview(data?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  const handleEdit = () => {
    setEditing(true);
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setAvatarPreview(profile?.avatar_url || null);
    setAvatarFile(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!user || user.id !== userId) return;

    setSaving(true);
    setMessage(null);

    try {
      let newAvatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setEditing(false);
      setAvatarFile(null);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography>Loading...</Typography>
          </Container>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography>Profile not found</Typography>
          </Container>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            {message && (
              <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={avatarPreview || profile.avatar_url || undefined}
                    sx={{ width: 120, height: 120 }}
                  >
                    {(editing ? displayName : profile.display_name)?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  {editing && user?.id === userId && (
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                      size="small"
                    >
                      <EditIcon />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  {editing && user?.id === userId ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        margin="normal"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        multiline
                        rows={3}
                        margin="normal"
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSave}
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {profile.display_name || 'No name'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {profile.bio || 'No bio'}
                      </Typography>
                      {user?.id === userId && (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={handleEdit}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>

            <PhotoAlbums userId={userId} isOwnProfile={user?.id === userId} />

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Posts
            </Typography>
            <PostFeed userId={userId} />
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

