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
              <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
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
  );
}

