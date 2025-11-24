'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, ImageList, ImageListItem, Link as MuiLink } from '@mui/material';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

interface PostAttachmentsProps {
  postId: string;
}

export default function PostAttachments({ postId }: PostAttachmentsProps) {
  const [attachments, setAttachments] = useState<any[]>([]);

  const fetchAttachments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('post_attachments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  }, [postId]);

  useEffect(() => {
    fetchAttachments();
  }, [postId, fetchAttachments]);

  if (attachments.length === 0) return null;

  const photos = attachments.filter((a) => a.type === 'photo');
  const urls = attachments.filter((a) => a.type === 'url');

  return (
    <Box sx={{ mt: 2 }}>
      {photos.length > 0 && (
        <ImageList cols={photos.length > 1 ? 2 : 1} gap={8}>
          {photos.map((photo) => (
            <ImageListItem key={photo.id} sx={{ position: 'relative', aspectRatio: '1' }}>
              <Image
                src={photo.url}
                alt="Post attachment"
                fill
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
      {urls.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {urls.map((url) => (
            <MuiLink
              key={url.id}
              href={url.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'block', mb: 1 }}
            >
              {url.metadata?.title || url.url}
            </MuiLink>
          ))}
        </Box>
      )}
    </Box>
  );
}

