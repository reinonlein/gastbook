'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import { Container, CircularProgress, Box } from '@mui/material';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirect to own profile page with posts
      router.push(`/profile/${user.id}`);
    }
  }, [user, router]);

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

