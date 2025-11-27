'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface FriendRequestButtonProps {
  targetUserId: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  onRequestSent?: () => void;
  onRequestCanceled?: () => void;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading';

export default function FriendRequestButton({
  targetUserId,
  variant = 'contained',
  size = 'medium',
  onRequestSent,
  onRequestCanceled,
}: FriendRequestButtonProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendshipStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  const checkFriendshipStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Check if friendship exists where current user sent request
      const { data: sentRequest } = await supabase
        .from('friends')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('friend_id', targetUserId)
        .maybeSingle();

      if (sentRequest) {
        if (sentRequest.status === 'pending') {
          setStatus('pending_sent');
          setFriendshipId(sentRequest.id);
          return;
        } else if (sentRequest.status === 'accepted') {
          setStatus('accepted');
          setFriendshipId(sentRequest.id);
          return;
        }
      }

      // Check if friendship exists where current user received request
      const { data: receivedRequest } = await supabase
        .from('friends')
        .select('id, status')
        .eq('user_id', targetUserId)
        .eq('friend_id', user.id)
        .maybeSingle();

      if (receivedRequest) {
        if (receivedRequest.status === 'pending') {
          setStatus('pending_received');
          setFriendshipId(receivedRequest.id);
          return;
        } else if (receivedRequest.status === 'accepted') {
          setStatus('accepted');
          setFriendshipId(receivedRequest.id);
          return;
        }
      }

      setStatus('none');
      setFriendshipId(null);
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setStatus('none');
      setFriendshipId(null);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setStatus('none');
      return;
    }

    checkFriendshipStatus();
  }, [user, targetUserId, checkFriendshipStatus]);

  const handleSendRequest = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('friends').insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: 'pending',
      }).select('id').single();

      if (error) throw error;
      if (data) {
        setFriendshipId(data.id);
      }
      // Recheck status to ensure consistency
      await checkFriendshipStatus();
      // Notify parent component that request was sent
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      alert(error?.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', targetUserId)
        .eq('friend_id', user.id);

      if (error) throw error;
      setStatus('accepted');
      
      // Trigger custom event to update sidebar
      window.dispatchEvent(new CustomEvent('friendsUpdated'));
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      alert(error?.message || 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user || loading) return;

    setLoading(true);
    setAnchorEl(null); // Close menu immediately
    
    try {
      console.log('Canceling request for:', { userId: user.id, targetUserId, friendshipId });
      
      // First, check what exists in the database
      const { data: existingData } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);
      
      console.log('Existing friendships:', existingData);
      
      // Try deleting by ID first if we have it
      if (friendshipId) {
        console.log('Attempting delete by ID:', friendshipId);
        const { data: deleteById, error: errorById } = await supabase
          .from('friends')
          .delete()
          .eq('id', friendshipId)
          .select();
        
        console.log('Delete by ID result:', { data: deleteById, error: errorById });
        
        if (errorById) {
          console.error('Error deleting by ID:', errorById);
        } else if (deleteById && deleteById.length > 0) {
          console.log('Successfully deleted by ID:', deleteById);
          setStatus('none');
          setFriendshipId(null);
          // Notify parent component that request was canceled
          if (onRequestCanceled) {
            onRequestCanceled();
          }
          // Trigger custom event to update sidebar
          window.dispatchEvent(new CustomEvent('friendsUpdated'));
          setTimeout(async () => {
            await checkFriendshipStatus();
          }, 100);
          setLoading(false);
          return;
        }
      }
      
      // Fallback: delete by user_id and friend_id (where current user is the sender)
      console.log('Attempting delete by user_id and friend_id');
      const { data: deleteData, error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', targetUserId)
        .eq('status', 'pending')
        .select();

      console.log('Delete by user_id/friend_id result:', { data: deleteData, error });

      if (error) {
        console.error('Delete error:', error);
        // Don't throw yet, try reverse direction
      } else if (deleteData && deleteData.length > 0) {
        console.log('Successfully deleted:', deleteData);
        setStatus('none');
        setFriendshipId(null);
        // Notify parent component that request was canceled
        if (onRequestCanceled) {
          onRequestCanceled();
        }
        // Trigger custom event to update sidebar
        window.dispatchEvent(new CustomEvent('friendsUpdated'));
        setTimeout(async () => {
          await checkFriendshipStatus();
        }, 100);
        setLoading(false);
        return;
      }
      
      // If nothing was deleted, try the reverse direction (where current user is the receiver)
      if (!deleteData || deleteData.length === 0) {
        console.log('Attempting reverse delete');
        const { data: reverseDelete, error: reverseError } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', targetUserId)
          .eq('friend_id', user.id)
          .eq('status', 'pending')
          .select();
        
        console.log('Reverse delete result:', { data: reverseDelete, error: reverseError });
        
        if (reverseError) {
          console.error('Reverse delete error:', reverseError);
          throw reverseError;
        } else if (reverseDelete && reverseDelete.length > 0) {
          console.log('Successfully deleted (reverse):', reverseDelete);
          setStatus('none');
          setFriendshipId(null);
          // Notify parent component that request was canceled
          if (onRequestCanceled) {
            onRequestCanceled();
          }
          // Trigger custom event to update sidebar
          window.dispatchEvent(new CustomEvent('friendsUpdated'));
          setTimeout(async () => {
            await checkFriendshipStatus();
          }, 100);
          setLoading(false);
          return;
        }
      }
      
      // If we get here, nothing was deleted
      console.warn('No records were deleted. This might be an RLS policy issue.');
      throw new Error('Failed to delete friend request. You may not have permission to delete this request.');
      
      // Reset state immediately
      setStatus('none');
      setFriendshipId(null);
      
      // Small delay to ensure database is updated
      setTimeout(async () => {
        await checkFriendshipStatus();
      }, 100);
    } catch (error: any) {
      console.error('Error canceling friend request:', error);
      alert(error?.message || 'Failed to cancel friend request');
      // Recheck status even on error
      await checkFriendshipStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSentClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!user || user.id === targetUserId) {
    return null;
  }

  if (status === 'loading') {
    return (
      <Button variant={variant} size={size} disabled>
        <CircularProgress size={16} sx={{ mr: 1 }} />
        Loading...
      </Button>
    );
  }

  if (status === 'none') {
    return (
      <Button
        variant={variant}
        size={size}
        startIcon={<PersonAddIcon />}
        onClick={handleSendRequest}
        disabled={loading}
      >
        Add Friend
      </Button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <>
        <Button 
          variant="outlined" 
          size={size} 
          onClick={handleRequestSentClick}
          disabled={loading}
          sx={{ cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Canceling...' : 'Request Sent'}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem 
            onClick={handleCancelRequest}
            disabled={loading}
            sx={{ color: 'error.main', fontSize: '0.875rem' }}
          >
            <CloseIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Cancel Request
          </MenuItem>
        </Menu>
      </>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button
        variant="contained"
        size={size}
        startIcon={<CheckIcon />}
        onClick={handleAcceptRequest}
        disabled={loading}
      >
        Accept Request
      </Button>
    );
  }

  if (status === 'accepted') {
    return (
      <Button variant="outlined" size={size} startIcon={<PersonIcon />} disabled>
        Friends
      </Button>
    );
  }

  return null;
}

