'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export type FontFamily = 'roboto' | 'open-sans' | 'montserrat' | 'albert-sans';

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within FontProvider');
  }
  return context;
}

interface FontProviderProps {
  children: ReactNode;
}

export default function FontProvider({ children }: FontProviderProps) {
  const { user } = useAuth();
  // Initialize from localStorage immediately if available
  const getInitialFont = (): FontFamily => {
    if (typeof window !== 'undefined') {
      const savedFont = localStorage.getItem('fontFamily') as FontFamily;
      if (savedFont && ['roboto', 'open-sans', 'montserrat', 'albert-sans'].includes(savedFont)) {
        return savedFont;
      }
    }
    return 'albert-sans';
  };
  
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(getInitialFont);
  const [loading, setLoading] = useState(true);

  const loadFontPreference = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const savedFont = data?.preferences?.fontFamily as FontFamily;
      if (savedFont && ['roboto', 'open-sans', 'montserrat', 'albert-sans'].includes(savedFont)) {
        setFontFamilyState(savedFont);
      } else {
        // Check localStorage as fallback
        const localStorageFont = localStorage.getItem('fontFamily') as FontFamily;
        if (localStorageFont && ['roboto', 'open-sans', 'montserrat', 'albert-sans'].includes(localStorageFont)) {
          setFontFamilyState(localStorageFont);
        }
      }
    } catch (error) {
      console.error('Error loading font preference:', error);
      // Fallback to localStorage
      const savedFont = localStorage.getItem('fontFamily') as FontFamily;
      if (savedFont && ['roboto', 'open-sans', 'montserrat', 'albert-sans'].includes(savedFont)) {
        setFontFamilyState(savedFont);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFontPreference();
    } else {
      // Load from localStorage if not logged in
      const savedFont = localStorage.getItem('fontFamily') as FontFamily;
      if (savedFont && ['roboto', 'open-sans', 'montserrat', 'albert-sans'].includes(savedFont)) {
        setFontFamilyState(savedFont);
      }
      setLoading(false);
    }
  }, [user, loadFontPreference]);

  const setFontFamily = async (font: FontFamily) => {
    setFontFamilyState(font);
    localStorage.setItem('fontFamily', font);

    // Update document class for immediate effect
    document.documentElement.className = document.documentElement.className
      .replace(/font-roboto|font-open-sans|font-montserrat|font-albert-sans/g, '');
    document.documentElement.classList.add(`font-${font}`);

    // Save to database if user is logged in
    if (user) {
      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const preferences = currentProfile?.preferences || {};
        preferences.fontFamily = font;

        const { error } = await supabase
          .from('profiles')
          .update({ preferences })
          .eq('id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving font preference:', error);
      }
    }
  };

  useEffect(() => {
    // Apply font class to document
    if (typeof document !== 'undefined') {
      document.documentElement.className = document.documentElement.className
        .replace(/font-roboto|font-open-sans|font-montserrat|font-albert-sans/g, '');
      document.documentElement.classList.add(`font-${fontFamily}`);
    }
  }, [fontFamily]);

  // Always provide context, even during loading
  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      {children}
    </FontContext.Provider>
  );
}

