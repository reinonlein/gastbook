'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Divider,
  Avatar,
  Typography,
  Badge,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  { text: 'Friends', icon: <PeopleIcon />, path: '/friends' },
  { text: 'Groups', icon: <WorkspacesIcon />, path: '/groups' },
  { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Search', icon: <SearchIcon />, path: '/search' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps = {}) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [friendsCount, setFriendsCount] = useState<number>(0);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Fetch profile for avatar
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);

      if (!error && data) {
        setUnreadNotifications(data.length || 0);
      }
    };

    fetchUnreadCount();

    // Subscribe to notifications changes
    const channel = supabase
      .channel(`sidebar-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch friends count
  useEffect(() => {
    if (!user) return;

    const fetchFriendsCount = async () => {
      try {
        // Get accepted friends where user_id = user.id
        const { data: friendsData1 } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        // Get accepted friends where friend_id = user.id
        const { data: friendsData2 } = await supabase
          .from('friends')
          .select('id')
          .eq('friend_id', user.id)
          .eq('status', 'accepted');

        const count = (friendsData1?.length || 0) + (friendsData2?.length || 0);
        setFriendsCount(count);
      } catch (error) {
        console.error('Error fetching friends count:', error);
      }
    };

    fetchFriendsCount();

    // Listen for custom event when friends are updated
    const handleFriendsUpdate = () => {
      setTimeout(() => {
        fetchFriendsCount();
      }, 100);
    };

    window.addEventListener('friendsUpdated', handleFriendsUpdate);

    // Subscribe to friends changes - listen for any changes where user is involved
    const channel = supabase
      .channel(`sidebar-friends:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          handleFriendsUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          handleFriendsUpdate();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('friendsUpdated', handleFriendsUpdate);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          pt: 2, 
          pb: 1.5, 
          px: 2, 
          display: { xs: 'none', md: 'flex' }, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: { xs: 'transparent', md: 'primary.main' },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            color: { xs: 'primary.main', md: 'white' }, 
            fontWeight: 600 
          }}
        >
          Gastbook
        </Typography>
      </Box>
      {user && (
        <>
          <Box 
            sx={{ 
              px: 2, 
              pb: 2, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 1,
              backgroundColor: { xs: 'transparent', md: 'primary.main' },
            }}
          >
            <Avatar src={profile?.avatar_url || undefined}>
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Typography 
              variant="body2" 
              sx={{ 
                color: { xs: 'primary.main', md: 'white' } 
              }}
            >
              {profile?.display_name || 'User'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      {!user && <Divider />}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isNotifications = item.text === 'Notifications';
          const isFriends = item.text === 'Friends';
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  router.push(item.path);
                  if (isMobile && onMobileClose) {
                    onMobileClose();
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  {isNotifications ? (
                    <Badge badgeContent={unreadNotifications > 0 ? unreadNotifications : 0} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    isFriends && friendsCount > 0
                      ? `${item.text} (${friendsCount})`
                      : item.text
                  } 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {user && (
        <>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  handleSignOut();
                  if (isMobile && onMobileClose) {
                    onMobileClose();
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  // On mobile, the drawer is controlled by AppBar
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen || false}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'background.paper',
            color: 'primary.main',
            '& .MuiListItemButton-root': {
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(76, 175, 80, 0.12)',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.16)',
                },
              },
            },
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
            '& .MuiDivider-root': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '& .MuiListItemText-primary': {
              color: 'text.primary',
            },
          },
        }}
      >
        {drawer}
      </Drawer>
    );
  }

  // On desktop, show permanent drawer
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            backgroundColor: 'background.paper',
            color: 'primary.main',
            '& .MuiListItemButton-root': {
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(76, 175, 80, 0.12)',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.16)',
                },
              },
            },
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
            '& .MuiDivider-root': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '& .MuiListItemText-primary': {
              color: 'text.primary',
            },
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

