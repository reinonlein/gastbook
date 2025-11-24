'use client';

import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Toolbar } from '@mui/material';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: { xs: '100%', md: `calc(100% - 240px)` },
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      {isMobile && <Toolbar />}
      {children}
    </Box>
  );
}

