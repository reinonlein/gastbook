'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import { useRouter } from 'next/navigation';
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/push-notifications';
import { useFont, type FontFamily } from '@/components/providers/FontProvider';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { fontFamily, setFontFamily } = useFont();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account settings
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Privacy settings (these would be stored in a user_settings table if needed)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setDisplayName(data?.display_name || '');
      setBio(data?.bio || '');
      setAvatarUrl(data?.avatar_url || null);
      setAvatarPreview(data?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSaveAccount = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setSaving(false);
          return;
        }

        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;

        setNewPassword('');
        setConfirmPassword('');
        setMessage({ type: 'success', text: 'Password updated successfully' });
      } else {
        setMessage({ type: 'success', text: 'Settings saved' });
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to update account settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Handle push notifications
      if (pushNotifications) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setMessage({
            type: 'error',
            text: 'Notification permission denied. Please enable notifications in your browser settings.',
          });
          setPushNotifications(false);
          setSaving(false);
          return;
        }

        const registration = await registerServiceWorker();
        if (registration) {
          await subscribeToPushNotifications(registration);
        }
      } else {
        // Unsubscribe from push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await unsubscribeFromPushNotifications(registration);
        }
      }

      // In a real app, you would save these to a user_settings table
      // For now, we'll just show a success message
      setMessage({ type: 'success', text: 'Privacy settings saved' });
    } catch (error: any) {
      console.error('Error updating privacy settings:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to update privacy settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out and redirect
      await signOut();
      router.push('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
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

  return (
    <ProtectedRoute>
      <PageLayout>
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Settings
            </Typography>

            {message && (
              <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            {/* Account Settings */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="Leave blank to keep current password"
                  />
                </Grid>
                {newPassword && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAccount}
                    disabled={saving}
                  >
                    Save Account Settings
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Appearance Settings */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Font Family</InputLabel>
                    <Select
                      value={fontFamily}
                      label="Font Family"
                      onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    >
                      <MenuItem value="roboto">Roboto</MenuItem>
                      <MenuItem value="open-sans">Open Sans</MenuItem>
                      <MenuItem value="montserrat">Montserrat</MenuItem>
                      <MenuItem value="albert-sans">Albert Sans</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Choose your preferred font family for the website
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Privacy Settings */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Privacy & Notifications
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Receive email notifications for friend requests, messages, and comments
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Receive browser push notifications for important updates
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePrivacy}
                    disabled={saving}
                  >
                    Save Privacy Settings
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Profile Settings */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={avatarPreview || avatarUrl || undefined}
                        sx={{ width: 100, height: 100 }}
                      >
                        {displayName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAvatarFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAvatarPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Click the edit icon to change your avatar
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={async () => {
                      if (!user) return;
                      setSaving(true);
                      setMessage(null);

                      try {
                        let newAvatarUrl = avatarUrl;

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

                        setAvatarUrl(newAvatarUrl);
                        setAvatarFile(null);
                        setMessage({ type: 'success', text: 'Profile updated successfully' });
                      } catch (error: any) {
                        console.error('Error updating profile:', error);
                        setMessage({ type: 'error', text: error?.message || 'Failed to update profile' });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Danger Zone */}
            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.main' }}>
              <Typography variant="h6" gutterBottom color="error">
                Danger Zone
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteAccount}
                sx={{ mt: 2 }}
              >
                Delete Account
              </Button>
            </Paper>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

