'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  ImageList,
  ImageListItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Album {
  id: string;
  name: string;
  created_at: string;
  photo_count?: number;
  thumbnail_url?: string;
}

interface Photo {
  id: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface PhotoAlbumsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function PhotoAlbums({ userId, isOwnProfile = false }: PhotoAlbumsProps) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchAlbums = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_albums')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get photo counts and thumbnails for each album
      const albumsWithPhotos = await Promise.all(
        (data || []).map(async (album) => {
          const { data: photos, error: photosError } = await supabase
            .from('album_photos')
            .select('url, thumbnail_url')
            .eq('album_id', album.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (photosError) {
            console.error('Error fetching photos:', photosError);
          }

          const { count } = await supabase
            .from('album_photos')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

          return {
            ...album,
            photo_count: count || 0,
            thumbnail_url: photos?.[0]?.thumbnail_url || photos?.[0]?.url || null,
          };
        })
      );

      setAlbums(albumsWithPhotos);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAlbums();
  }, [userId, fetchAlbums]);

  const handleCreateAlbum = async () => {
    if (!user || !albumName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_albums')
        .insert({
          user_id: user.id,
          name: albumName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setCreateDialogOpen(false);
      setAlbumName('');
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album');
    }
  };

  const handleViewAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setViewDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from('album_photos')
        .select('*')
        .eq('album_id', album.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbumPhotos(data || []);
    } catch (error) {
      console.error('Error fetching album photos:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Photo Albums</Typography>
          {isOwnProfile && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Album
            </Button>
          )}
        </Box>

        {albums.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <PhotoLibraryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No albums yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {albums.map((album) => (
              <Grid item xs={6} sm={4} md={3} key={album.id}>
                <Card
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewAlbum(album)}
                >
                  {album.thumbnail_url ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={album.thumbnail_url}
                      alt={album.name}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                      }}
                    >
                      <PhotoLibraryIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" noWrap>
                      {album.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {album.photo_count || 0} photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Album
          <IconButton
            onClick={() => setCreateDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Album Name"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAlbum}
            variant="contained"
            disabled={!albumName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedAlbum?.name}
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {albumPhotos.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No photos in this album yet
              </Typography>
              {isOwnProfile && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => {
                    // TODO: Implement add photos functionality
                    alert('Add photos functionality coming soon');
                  }}
                >
                  Add Photos
                </Button>
              )}
            </Box>
          ) : (
            <ImageList cols={3} gap={8}>
              {albumPhotos.map((photo) => (
                <ImageListItem key={photo.id} sx={{ position: 'relative', aspectRatio: '1' }}>
                  <Image
                    src={photo.thumbnail_url || photo.url}
                    alt=""
                    fill
                    style={{ borderRadius: 4, objectFit: 'cover' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

