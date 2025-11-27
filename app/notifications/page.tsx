'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user, fetchNotifications, subscribeToNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      
      if (unreadIds.length === 0) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );

      setMenuAnchor(null);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );

      setNotificationMenuAnchor(null);
      setSelectedNotificationId(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };


  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setNotificationMenuAnchor(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
    setSelectedNotificationId(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <PersonAddIcon />;
      case 'group_invite':
      case 'group_request':
        return <GroupIcon />;
      case 'like':
        return <FavoriteIcon />;
      case 'comment':
        return <CommentIcon />;
      default:
        return null;
    }
  };

  const getNotificationTitle = (notification: Notification): string => {
    if (notification.type === 'friend_request' && notification.message) {
      // Extract name from message (format: "Bas wants to be your friend")
      const match = notification.message.match(/^(.+?)\s+wants to be your friend$/);
      if (match && match[1]) {
        return `${match[1]} wants to be your friend`;
      }
      // Fallback: if message format is different, try to extract name
      const nameMatch = notification.message.match(/^(.+?)\s+/);
      if (nameMatch && nameMatch[1]) {
        return `${nameMatch[1]} wants to be your friend`;
      }
    }
    return notification.title;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h4">Notifications</Typography>
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 ? (
                    <>
                      <Chip 
                        label={`${unreadCount} unread`} 
                        color="primary" 
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                      >
                        <MenuItem onClick={handleMarkAllAsRead}>
                          Mark all as read
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <Chip 
                      label={`${notifications.length} total`} 
                      color="primary" 
                    />
                  )}
                </>
              )}
            </Box>

            <Paper>
              <List>
                {notifications.map((notification) => (
                  <ListItem 
                    key={notification.id} 
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => handleNotificationMenuOpen(e, notification.id)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.link) {
                          // If it's a friend request notification, go to requests tab
                          if (notification.type === 'friend_request' && notification.link === '/friends') {
                            router.push('/friends?tab=requests');
                          } else {
                            router.push(notification.link);
                          }
                        }
                      }}
                      sx={{
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={getNotificationTitle(notification)}
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {notification.type === 'friend_request' 
                                ? 'You received a new friend request'
                                : notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
                {notifications.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No notifications yet
                    </Typography>
                  </Box>
                )}
              </List>
              <Menu
                anchorEl={notificationMenuAnchor}
                open={Boolean(notificationMenuAnchor)}
                onClose={handleNotificationMenuClose}
              >
                <MenuItem 
                  onClick={() => selectedNotificationId && handleDeleteNotification(selectedNotificationId)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Delete
                </MenuItem>
              </Menu>
            </Paper>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

