'use client';

import { useState } from 'react';
import { Container, Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PostFeed from '@/components/posts/PostFeed';
import CreatePostDialog from '@/components/posts/CreatePostDialog';
import FloatingActionButton from '@/components/ui/FloatingActionButton';

export default function Home() {
  const [feedType, setFeedType] = useState<'friends' | 'public'>('friends');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'friends' | 'public' | null
  ) => {
    if (newType !== null) {
      setFeedType(newType);
    }
  };

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={feedType}
              exclusive
              onChange={handleFeedTypeChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.12)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                },
              }}
            >
              <ToggleButton value="friends">Friends</ToggleButton>
              <ToggleButton value="public">Public</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <PostFeed key={refreshKey} feedType={feedType} />
        </Container>
        <FloatingActionButton onClick={() => setCreatePostOpen(true)} />
        <CreatePostDialog
          open={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onPostCreated={handlePostCreated}
        />
      </PageLayout>
    </ProtectedRoute>
  );
}

