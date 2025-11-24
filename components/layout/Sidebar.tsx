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
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  { text: 'Groups', icon: <GroupIcon />, path: '/groups' },
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

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ pt: 7, pb:1.5, px: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          Gastbook
        </Typography>
      </Box>
      {user && (
        <>
          <Box sx={{ px: 2, pb: 7, display: 'flex', justifyContent: 'center', alignItems: 'center', gap:1 }}>
            <Avatar src={profile?.avatar_url || undefined}>
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {profile?.display_name || 'User'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      {!user && <Divider />}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
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
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
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
                <ListItemIcon sx={{ color: 'white' }}>
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
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiListItemButton-root': {
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.dark',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
            '& .MuiDivider-root': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '& .MuiTypography-root': {
              color: 'white',
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
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100vh',
          backgroundColor: 'primary.main',
          color: 'white',
          '& .MuiListItemButton-root': {
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.dark',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: 'white',
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          '& .MuiTypography-root': {
            color: 'white',
          },
        },
      }}
      open
    >
      {drawer}
    </Drawer>
  );
}

