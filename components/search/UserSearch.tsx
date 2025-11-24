'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface User {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserSearchProps {
  onUserSelect?: (userId: string) => void;
}

export default function UserSearch({ onUserSelect }: UserSearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    if (!term.trim() || !user) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${term}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Search users..."
        value={searchTerm}
        onChange={handleChange}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />
      {results.length > 0 && (
        <Paper sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
          <List>
            {results.map((result) => (
              <ListItem key={result.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (onUserSelect) {
                      onUserSelect(result.id);
                    }
                    setSearchTerm('');
                    setResults([]);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={result.avatar_url || undefined}>
                      {result.display_name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={result.display_name || 'Unknown'} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

