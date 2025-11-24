'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import AppBar from './AppBar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar onMenuClick={handleDrawerToggle} />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <MainContent>{children}</MainContent>
      </Box>
    </>
  );
}

