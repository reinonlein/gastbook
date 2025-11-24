'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Box, CircularProgress, Typography } from '@mui/material';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for hash fragments (Supabase OAuth uses #)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for query params (email verification uses ?)
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const code = searchParams.get('code');

        if (error) {
          console.error('Auth error:', error, errorDescription);
          router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`);
          return;
        }

        // Handle OAuth callback with hash fragments
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          router.push('/');
          router.refresh();
          return;
        }

        // Handle email verification (token in query params)
        if (token && type === 'signup') {
          // Supabase already verified the token when the link was clicked
          // We just need to check if user is authenticated
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          if (user) {
            router.push('/');
            router.refresh();
            return;
          }
        }

        // Handle code exchange (OAuth with code)
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          router.push('/');
          router.refresh();
          return;
        }

        // If we get here, no valid auth params found
        router.push('/login?error=invalid_callback');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        router.push(`/login?error=${encodeURIComponent(err.message || 'authentication_failed')}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Verifying your account...
      </Typography>
    </Box>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

