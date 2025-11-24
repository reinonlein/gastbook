# Supabase Setup Guide

This guide will walk you through setting up your Supabase backend for Gastbook.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `gastbook` (or your preferred name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to your users
5. Wait for the project to be created (takes a few minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add these to your `.env.local` file

## Step 3: Enable Required Features

### Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optionally enable **Google** or other OAuth providers if desired
4. Configure email templates if needed

### Storage

1. Go to **Storage**
2. We'll create buckets in the next step

## Step 4: Create Database Tables

Run the following SQL in the Supabase SQL Editor (**SQL Editor** → **New Query**):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Friends table
CREATE TABLE public.friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Posts table
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('public', 'friends', 'private')) DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Post attachments (photos, URLs)
CREATE TABLE public.post_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('photo', 'url')) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comments table
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Likes table (for posts and comments)
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Groups table
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'moderator', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('pending', 'accepted', 'banned')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Group posts table
CREATE TABLE public.group_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(group_id, post_id)
);

-- Messages table (private messages)
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User albums (for profile photos)
CREATE TABLE public.user_albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Default Album',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Album photos
CREATE TABLE public.album_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES public.user_albums(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_comment_id ON public.likes(comment_id);
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
```

## Step 5: Set Up Row Level Security (RLS)

Enable RLS and create policies for each table:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view own friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend requests"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Posts policies
CREATE POLICY "Users can view public posts"
  ON public.posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view friends' posts"
  ON public.posts FOR SELECT
  USING (
    visibility = 'friends' AND
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id AND friends.status = 'accepted')
      OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id AND friends.status = 'accepted')
    )
  );

CREATE POLICY "Users can view own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Post attachments policies
CREATE POLICY "Attachments follow post visibility"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_attachments.post_id
      AND (
        posts.visibility = 'public' OR
        posts.user_id = auth.uid() OR
        (posts.visibility = 'friends' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id AND friends.status = 'accepted')
          OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id AND friends.status = 'accepted')
        ))
      )
    )
  );

CREATE POLICY "Users can add attachments to own posts"
  ON public.post_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_attachments.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Comments follow post visibility"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = comments.post_id
      AND (
        posts.visibility = 'public' OR
        posts.user_id = auth.uid() OR
        (posts.visibility = 'friends' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id AND friends.status = 'accepted')
          OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id AND friends.status = 'accepted')
        ))
      )
    )
  );

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes follow post/comment visibility"
  ON public.likes FOR SELECT
  USING (
    (post_id IS NULL OR EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = likes.post_id
      AND (
        posts.visibility = 'public' OR
        posts.user_id = auth.uid() OR
        (posts.visibility = 'friends' AND EXISTS (
          SELECT 1 FROM public.friends
          WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id AND friends.status = 'accepted')
          OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id AND friends.status = 'accepted')
        ))
      )
    ))
    AND
    (comment_id IS NULL OR EXISTS (
      SELECT 1 FROM public.comments
      WHERE comments.id = likes.comment_id
      AND EXISTS (
        SELECT 1 FROM public.posts
        WHERE posts.id = comments.post_id
        AND (
          posts.visibility = 'public' OR
          posts.user_id = auth.uid() OR
          (posts.visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friends
            WHERE (friends.user_id = auth.uid() AND friends.friend_id = posts.user_id AND friends.status = 'accepted')
            OR (friends.friend_id = auth.uid() AND friends.user_id = posts.user_id AND friends.status = 'accepted')
          ))
        )
      )
    ))
  );

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Users can view public groups"
  ON public.groups FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view groups they're members of"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'accepted'
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Users can view group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND (groups.is_public = true OR groups.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.status = 'accepted'
      ))
    )
  );

CREATE POLICY "Users can request to join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group owners/moderators can update member status"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND (gm.role = 'owner' OR gm.role = 'moderator')
      AND g.id = group_members.group_id
    )
  );

-- Group posts policies
CREATE POLICY "Users can view group posts for accessible groups"
  ON public.group_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_posts.group_id
      AND (
        groups.is_public = true
        OR groups.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_members.group_id = groups.id
          AND group_members.user_id = auth.uid()
          AND group_members.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Group members can add posts to groups"
  ON public.group_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = group_posts.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners/moderators can remove posts from groups"
  ON public.group_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.group_id = group_posts.group_id
      AND gm.user_id = auth.uid()
      AND (gm.role = 'owner' OR gm.role = 'moderator')
      AND g.id = group_posts.group_id
    )
  );

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages (mark as read)"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- User albums policies
CREATE POLICY "Users can view own albums"
  ON public.user_albums FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own albums"
  ON public.user_albums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own albums"
  ON public.user_albums FOR UPDATE
  USING (auth.uid() = user_id);

-- Album photos policies
CREATE POLICY "Photos follow album visibility"
  ON public.album_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_albums
      WHERE user_albums.id = album_photos.album_id
      AND user_albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add photos to own albums"
  ON public.album_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_albums
      WHERE user_albums.id = album_photos.album_id
      AND user_albums.user_id = auth.uid()
    )
  );
```

## Step 6: Create Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:

### `avatars` bucket
- **Name**: `avatars`
- **Public**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### `post-images` bucket
- **Name**: `post-images`
- **Public**: Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### `album-photos` bucket
- **Name**: `album-photos`
- **Public**: Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### `group-avatars` bucket
- **Name**: `group-avatars`
- **Public**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## Step 7: Set Up Storage Policies

For each bucket, add the following policies in **Storage** → **Policies**:

### Avatars bucket policies:
```sql
-- Anyone can view avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Post images bucket policies:
```sql
-- Anyone can view post images
CREATE POLICY "Public post image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Users can upload post images
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images');

-- Users can delete their own post images
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Album photos bucket policies:
```sql
-- Users can view album photos (will be filtered by app logic)
CREATE POLICY "Public album photo access"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-photos');

-- Users can upload album photos
CREATE POLICY "Users can upload album photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'album-photos');

-- Users can delete their own album photos
CREATE POLICY "Users can delete own album photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'album-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Group avatars bucket policies:
```sql
-- Anyone can view group avatars
CREATE POLICY "Public group avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-avatars');

-- Group owners can upload group avatars
CREATE POLICY "Group owners can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'group-avatars');

-- Group owners can update group avatars
CREATE POLICY "Group owners can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'group-avatars');
```

## Step 8: Create Database Functions

Create helper functions for common operations:

```sql
-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create default album
  INSERT INTO public.user_albums (user_id, name)
  VALUES (NEW.id, 'Default Album');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## Step 9: Set Up Notification Triggers (Optional but Recommended)

Create triggers to automatically generate notifications for various events:

```sql
-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for friend requests
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT display_name INTO requester_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
      NEW.friend_id,
      'friend_request',
      'New Friend Request',
      COALESCE(requester_name, 'Someone') || ' wants to be your friend',
      '/friends'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

-- Trigger for likes on posts
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  liker_name TEXT;
  post_owner_id UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_owner_id != NEW.user_id THEN
    SELECT display_name INTO liker_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
      post_owner_id,
      'like',
      'New Like',
      COALESCE(liker_name, 'Someone') || ' liked your post',
      '/'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_liked
  AFTER INSERT ON public.likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_post_like();

-- Trigger for comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  commenter_name TEXT;
  post_owner_id UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF post_owner_id != NEW.user_id THEN
    SELECT display_name INTO commenter_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
      post_owner_id,
      'comment',
      'New Comment',
      COALESCE(commenter_name, 'Someone') || ' commented on your post',
      '/'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_commented
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- Trigger for group join requests
CREATE OR REPLACE FUNCTION public.notify_group_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
  group_owner_id UUID;
  group_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT owner_id, name INTO group_owner_id, group_name
    FROM public.groups
    WHERE id = NEW.group_id;
    
    SELECT display_name INTO requester_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    PERFORM public.create_notification(
      group_owner_id,
      'group_request',
      'Group Join Request',
      COALESCE(requester_name, 'Someone') || ' wants to join ' || group_name,
      '/groups'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_request_created
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_request();
```

## Step 10: Verify Setup

1. Check that all tables are created: Go to **Table Editor** and verify all tables exist
2. Check RLS is enabled: Tables should show a shield icon
3. Test authentication: Try signing up a test user
4. Verify storage buckets: Check that all buckets are created and accessible

## Next Steps

Once Supabase is set up, you can proceed to Step 3: Building the frontend. The frontend code will connect to these tables and use the RLS policies for security.

