'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import PostCard from './PostCard';

interface Post {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

interface PostFeedProps {
  feedType?: 'friends' | 'public';
  userId?: string; // Filter posts by specific user
  groupId?: string; // Filter posts by specific group
}

export default function PostFeed({ feedType = 'friends', userId, groupId }: PostFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (offset = 0, limit = 10) => {
      if (!user && !userId) return [];

      try {
        let query = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        // Filter by user ID if provided
        if (userId) {
          query = query.eq('user_id', userId);
          
          // If viewing own profile, show all posts
          // If viewing someone else's profile, only show public and friends posts (if friends)
          if (user && userId !== user.id) {
            // Check if users are friends
            const { data: friendship } = await supabase
              .from('friends')
              .select('status')
              .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
              .eq('status', 'accepted')
              .maybeSingle();

            const isFriend = !!friendship;
            
            if (isFriend) {
              // Show public and friends posts
              query = query.in('visibility', ['public', 'friends']);
            } else {
              // Only show public posts
              query = query.eq('visibility', 'public');
            }
          }
          // If viewing own profile, no visibility filter needed - show all
        }

        // Filter by group ID if provided
        if (groupId) {
          const { data: groupPosts } = await supabase
            .from('group_posts')
            .select('post_id')
            .eq('group_id', groupId);

          if (groupPosts && groupPosts.length > 0) {
            const postIds = groupPosts.map((gp) => gp.post_id);
            query = query.in('id', postIds);
          } else {
            // No posts in this group, return empty
            return [];
          }
        }

        if (!userId && !groupId) {
          // Only apply feedType filtering if not filtering by user or group
          if (!user) {
            // If no user, only show public posts
            query = query.eq('visibility', 'public');
          } else if (feedType === 'friends') {
          // Get friend IDs
          const { data: friendships, error: friendshipsError } = await supabase
            .from('friends')
            .select('user_id, friend_id')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq('status', 'accepted');

          // If friends table doesn't exist or has errors, just show own posts
          if (friendshipsError) {
            console.warn('Error fetching friendships (table may not exist yet):', friendshipsError.message);
          }

          const friendIds = new Set<string>();
          friendIds.add(user.id); // Include own posts
          friendships?.forEach((f) => {
            if (f.user_id === user.id) {
              friendIds.add(f.friend_id);
            } else {
              friendIds.add(f.user_id);
            }
          });

          query = query.in('user_id', Array.from(friendIds));
        } else {
          // Public feed - show public posts from non-friends
          const { data: friendships, error: friendshipsError } = await supabase
            .from('friends')
            .select('user_id, friend_id')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq('status', 'accepted');

          // If friends table doesn't exist or has errors, show all public posts
          if (friendshipsError) {
            console.warn('Error fetching friendships (table may not exist yet):', friendshipsError.message);
          }

          const friendIds = new Set<string>();
          friendIds.add(user.id);
          friendships?.forEach((f) => {
            if (f.user_id === user.id) {
              friendIds.add(f.friend_id);
            } else {
              friendIds.add(f.user_id);
            }
          });

          // Filter out friend IDs - exclude posts from friends
          query = query.eq('visibility', 'public');
          if (friendIds.size > 0) {
            const friendIdsArray = Array.from(friendIds);
            // Filter out friend IDs using not().in() syntax
            // Note: If this causes issues, we may need to filter results in memory instead
            query = query.not('user_id', 'in', `(${friendIdsArray.join(',')})`);
          }
        }
        }

        const { data, error } = await query;

        if (error) throw error;

        // Fetch profiles for all user IDs
        const userIds = [...new Set((data || []).map((post: any) => post.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Create a map of user_id to profile
        const profilesMap = new Map(
          (profilesData || []).map((profile: any) => [profile.id, profile])
        );

        // Get likes and comments count for each post
        const postsWithCounts = await Promise.all(
          (data || []).map(async (post: any) => {
            try {
              const { count: likesCount, error: likesError } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

              const { count: commentsCount, error: commentsError } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

              let userLike = null;
              let userLikeError = null;
              if (user) {
                const result = await supabase
                  .from('likes')
                  .select('id')
                  .eq('post_id', post.id)
                  .eq('user_id', user.id)
                  .maybeSingle();
                userLike = result.data;
                userLikeError = result.error;
              }

              return {
                ...post,
                profiles: profilesMap.get(post.user_id) || {
                  display_name: null,
                  avatar_url: null,
                },
                likes_count: likesCount || 0,
                comments_count: commentsCount || 0,
                user_liked: !!userLike && !userLikeError,
              };
            } catch (err) {
              // If there's an error fetching counts, return post with default values
              console.warn('Error fetching counts for post:', post.id, err);
              return {
                ...post,
                profiles: profilesMap.get(post.user_id) || {
                  display_name: null,
                  avatar_url: null,
                },
                likes_count: 0,
                comments_count: 0,
                user_liked: false,
              };
            }
          })
        );

        return postsWithCounts;
      } catch (error: any) {
        console.error('Error fetching posts:', error?.message || error || 'Unknown error');
        // Log more details if available
        if (error?.details) {
          console.error('Error details:', error.details);
        }
        if (error?.hint) {
          console.error('Error hint:', error.hint);
        }
        return [];
      }
    },
    [user, feedType, userId, groupId]
  );

  const loadPosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const newPosts = await fetchPosts(posts.length);
    if (newPosts.length === 0) {
      setHasMore(false);
    } else {
      setPosts((prev) => [...prev, ...newPosts]);
    }
    setLoadingMore(false);
  }, [posts.length, fetchPosts, loadingMore, hasMore]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, 10).then((data) => {
      setPosts(data);
      setLoading(false);
      if (data.length < 10) {
        setHasMore(false);
      }
    });
  }, [feedType, user, userId, groupId, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadPosts, hasMore, loadingMore]);

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdate = () => {
    // Refresh posts
    setLoading(true);
    fetchPosts(0, posts.length).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (posts.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No posts to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={() => handlePostDelete(post.id)}
          onUpdate={handlePostUpdate}
        />
      ))}
      <div ref={observerTarget} style={{ height: 20 }} />
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
}

