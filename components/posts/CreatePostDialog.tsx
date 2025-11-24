'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoIcon from '@mui/icons-material/Photo';
import LinkIcon from '@mui/icons-material/Link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  groupId?: string; // Optional group ID to associate post with group
}

export default function CreatePostDialog({
  open,
  onClose,
  onPostCreated,
  groupId,
}: CreatePostDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addUrlField = () => {
    setUrls((prev) => [...prev, '']);
  };

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
  };

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);

    try {
      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          visibility,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${post.id}/${Date.now()}-${i}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('post-images').getPublicUrl(filePath);

        await supabase.from('post_attachments').insert({
          post_id: post.id,
          type: 'photo',
          url: publicUrl,
        });
      }

      // Add URLs
      for (const url of urls) {
        if (url.trim()) {
          await supabase.from('post_attachments').insert({
            post_id: post.id,
            type: 'url',
            url: url.trim(),
          });
        }
      }

      // Associate post with group if groupId is provided
      if (groupId) {
        const { error: groupPostError } = await supabase
          .from('group_posts')
          .insert({
            group_id: groupId,
            post_id: post.id,
          });

        if (groupPostError) {
          console.error('Error associating post with group:', groupPostError);
          // Don't throw - post was created successfully
        }
      }

      // Reset form
      setContent('');
      setVisibility('public');
      setPhotos([]);
      setPhotoPreviews([]);
      setUrls(['']);
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {groupId ? 'Create Post in Group' : 'Create Post'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Visibility</InputLabel>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            label="Visibility"
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="friends">Friends Only</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            multiple
            onChange={handlePhotoChange}
          />
          <label htmlFor="photo-upload">
            <Button
              component="span"
              startIcon={<PhotoIcon />}
              variant="outlined"
              size="small"
            >
              Add Photos
            </Button>
          </label>

          {photoPreviews.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {photoPreviews.map((preview, index) => (
                <Box key={index} sx={{ position: 'relative', width: 100, height: 100 }}>
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    unoptimized
                    style={{
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removePhoto(index)}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LinkIcon />
            <Typography variant="subtitle2">Add URLs</Typography>
          </Box>
          {urls.map((url, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="https://..."
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
              />
              {urls.length > 1 && (
                <Button onClick={() => removeUrl(index)}>Remove</Button>
              )}
            </Box>
          ))}
          <Button onClick={addUrlField} size="small" startIcon={<LinkIcon />}>
            Add Another URL
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!content.trim() || loading}
        >
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

