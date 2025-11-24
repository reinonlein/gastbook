'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  user_liked?: boolean;
}

interface PostCommentsProps {
  postId: string;
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      // First, fetch comments without the relationship (to avoid schema cache issues)
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all user IDs
      const userIds = [...new Set((data || []).map((comment: any) => comment.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        (profilesData || []).map((profile: any) => [profile.id, profile])
      );

      // Process the data to get likes count and user liked status
      const processedComments = await Promise.all(
        (data || []).map(async (comment: any) => {
          try {
            const { count: likesCount, error: likesError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id);

            let userLiked = false;
            if (user) {
              const { data: likeData, error: userLikeError } = await supabase
                .from('likes')
                .select('id')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
                .maybeSingle();
              userLiked = !!likeData && !userLikeError;
            }

            return {
              ...comment,
              profiles: profilesMap.get(comment.user_id) || {
                display_name: null,
                avatar_url: null,
              },
              likes_count: likesCount || 0,
              user_liked: userLiked,
            };
          } catch (err) {
            // If there's an error fetching counts, return comment with default values
            console.warn('Error fetching counts for comment:', comment.id, err);
            return {
              ...comment,
              profiles: profilesMap.get(comment.user_id) || {
                display_name: null,
                avatar_url: null,
              },
              likes_count: 0,
              user_liked: false,
            };
          }
        })
      );

      setComments(processedComments);
    } catch (error: any) {
      console.error('Error fetching comments:', error?.message || error || 'Unknown error');
      // Log more details if available
      if (error?.details) {
        console.error('Error details:', error.details);
      }
      if (error?.hint) {
        console.error('Error hint:', error.hint);
      }
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchComments();
  }, [postId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment,
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ comment_id: commentId, user_id: user.id });

        if (error) throw error;
      }

      fetchComments();
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  if (loading) {
    return <Typography>Loading comments...</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {comments.map((comment) => (
        <Paper key={comment.id} sx={{ p: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Avatar
              src={comment.profiles.avatar_url || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {comment.profiles.display_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2">
                {comment.profiles.display_name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mb: 1, ml: 5 }}>
            {comment.content}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
            <IconButton
              size="small"
              onClick={() => handleLikeComment(comment.id, comment.user_liked || false)}
              color={comment.user_liked ? 'error' : 'default'}
            >
              {comment.user_liked ? (
                <FavoriteIcon fontSize="small" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="caption">{comment.likes_count || 0}</Typography>
          </Box>
        </Paper>
      ))}

      {user && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            InputProps={{
              endAdornment: (
                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disabled={!newComment.trim()}
                >
                  <SendIcon />
                </Button>
              ),
            }}
          />
        </Box>
      )}
    </Box>
  );
}

