'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import PostComments from './PostComments';
import PostAttachments from './PostAttachments';

interface Post {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export default function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState(post.visibility);

  const isOwner = user?.id === post.user_id;

  const handleProfileClick = () => {
    router.push(`/profile/${post.user_id}`);
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id });

        if (error) throw error;
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    if (!user || !isOwner) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editContent,
          visibility: editVisibility,
        })
        .eq('id', post.id);

      if (error) throw error;
      setEditDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };


  return (
    <>
      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardHeader
          avatar={
            <Avatar 
              src={post.profiles.avatar_url || undefined}
              sx={{ cursor: 'pointer' }}
              onClick={handleProfileClick}
            >
              {post.profiles.display_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          }
          title={
            <Typography 
              variant="subtitle2" 
              sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}
              onClick={handleProfileClick}
            >
              {post.profiles.display_name || 'Unknown User'}
            </Typography>
          }
          subheader={formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          action={
            isOwner && (
              <>
                <Chip
                  label={post.visibility}
                  size="small"
                  color={post.visibility === 'public' ? 'primary' : 'default'}
                />
                <IconButton onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleEdit}>
                    <EditIcon sx={{ mr: 1 }} /> Edit
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    <DeleteIcon sx={{ mr: 1 }} /> Delete
                  </MenuItem>
                </Menu>
              </>
            )
          }
        />
        <CardContent>
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </Typography>
          <PostAttachments postId={post.id} />
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <IconButton
              onClick={handleLike}
              color={liked ? 'error' : 'default'}
              size="small"
            >
              {liked ? <FavoriteIcon /> : <FavoriteBorderIcon sx={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
            </IconButton>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              {likesCount}
            </Typography>
            <IconButton sx={{ml: 5}}
              onClick={() => setShowComments(!showComments)}
              size="small"
            >
              <CommentIcon sx={{ color: 'rgba(0, 0, 0, 0.25)' }} />
            </IconButton>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              {post.comments_count || 0}
            </Typography>
          </Box>
          {showComments && <PostComments postId={post.id} />}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value as any)}
              label="Visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="friends">Friends Only</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

