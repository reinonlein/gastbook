'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
} from '@mui/material';
import { supabase } from '@/lib/supabase/client';
import { loadRecaptcha, executeRecaptcha } from '@/lib/recaptcha';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [checkingDisplayName, setCheckingDisplayName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const formStartTime = useRef<number>(Date.now());
  const recaptchaLoaded = useRef<boolean>(false);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Load reCAPTCHA on mount
  useEffect(() => {
    if (recaptchaSiteKey && typeof window !== 'undefined') {
      loadRecaptcha(recaptchaSiteKey)
        .then(() => {
          recaptchaLoaded.current = true;
        })
        .catch((err) => {
          console.error('Failed to load reCAPTCHA:', err);
        });
    }
  }, [recaptchaSiteKey]);

  // Check display name availability with debouncing
  useEffect(() => {
    if (!displayName.trim()) {
      setDisplayNameError('');
      return;
    }

    const checkDisplayName = async () => {
      setCheckingDisplayName(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('display_name', displayName.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setDisplayNameError('This display name is already taken');
        } else {
          setDisplayNameError('');
        }
      } catch (err) {
        console.error('Error checking display name:', err);
        // Don't show error on check failure, just log it
      } finally {
        setCheckingDisplayName(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkDisplayName, 500);
    return () => clearTimeout(timeoutId);
  }, [displayName]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      setError('Invalid submission. Please try again.');
      return;
    }

    // Timing check - if form submitted too quickly (< 3 seconds), likely a bot
    const formFillTime = Date.now() - formStartTime.current;
    if (formFillTime < 3000) {
      console.warn('Form submitted too quickly, possible bot');
      setError('Please take your time filling out the form.');
      return;
    }

    // Check display name one more time before submitting
    if (displayName.trim()) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', displayName.trim())
        .maybeSingle();

      if (data) {
        setDisplayNameError('This display name is already taken');
        return;
      }
    }

    if (displayNameError) {
      return;
    }

    setLoading(true);

    try {
      // Verify reCAPTCHA if enabled
      if (recaptchaSiteKey && recaptchaLoaded.current) {
        try {
          const recaptchaToken = await executeRecaptcha(recaptchaSiteKey, 'signup');
          
          // Verify token on server
          const verifyResponse = await fetch('/api/recaptcha', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: recaptchaToken }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyData.success) {
            throw new Error('reCAPTCHA verification failed. Please try again.');
          }
        } catch (recaptchaError: any) {
          setError(recaptchaError.message || 'Security verification failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Show success message about email verification
      setError('');
      alert('Sign up successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign up for Gastbook
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignup}>
            {/* Honeypot field - hidden from users, visible to bots */}
            <TextField
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              sx={{
                position: 'absolute',
                left: '-9999px',
                opacity: 0,
                pointerEvents: 'none',
              }}
              tabIndex={-1}
              autoComplete="off"
            />

            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setDisplayNameError('');
              }}
              onBlur={() => {
                // Trigger check on blur if not already checking
                if (displayName.trim() && !checkingDisplayName) {
                  // The useEffect will handle the check
                }
              }}
              required
              margin="normal"
              error={!!displayNameError}
              helperText={displayNameError || (checkingDisplayName ? 'Checking availability...' : '')}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              helperText="Password must be at least 6 characters"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || checkingDisplayName || !!displayNameError}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
            <Typography align="center">
              Already have an account?{' '}
              <Link href="/login" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

