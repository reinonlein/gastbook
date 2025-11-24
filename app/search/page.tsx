'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  TextField,
  Typography,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import ArticleIcon from '@mui/icons-material/Article';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import { formatDistanceToNow } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);

    try {
      if (activeTab === 0 || activeTab === 1) {
        // Search users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .or(`display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
          .limit(20);

        if (usersError) throw usersError;
        setUsers(usersData || []);
      }

      if (activeTab === 0 || activeTab === 2) {
        // Search groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
      }

      if (activeTab === 0 || activeTab === 3) {
        // Search posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles:user_id(id, display_name, avatar_url)')
          .ilike('content', `%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) throw postsError;
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setUsers([]);
        setGroups([]);
        setPosts([]);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, handleSearch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Search
            </Typography>

            <TextField
              fullWidth
              placeholder="Search for users, groups, or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Paper sx={{ mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="search tabs">
                <Tab label="All" />
                <Tab label="Users" icon={<PersonIcon />} iconPosition="start" />
                <Tab label="Groups" icon={<GroupIcon />} iconPosition="start" />
                <Tab label="Posts" icon={<ArticleIcon />} iconPosition="start" />
              </Tabs>
            </Paper>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && (
              <>
                <TabPanel value={activeTab} index={0}>
                  {/* All Results */}
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      Users ({users.length})
                    </Typography>
                    {users.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                        {users.map((userProfile) => (
                          <Card
                            key={userProfile.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/profile/${userProfile.id}`)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={userProfile.avatar_url || undefined}>
                                  {userProfile.display_name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1">
                                    {userProfile.display_name || 'No name'}
                                  </Typography>
                                  {userProfile.bio && (
                                    <Typography variant="body2" color="text.secondary">
                                      {userProfile.bio}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      Groups ({groups.length})
                    </Typography>
                    {groups.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No groups found
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                        {groups.map((group) => (
                          <Card
                            key={group.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/groups/${group.id}`)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={group.avatar_url || undefined}>
                                  <GroupIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1">{group.name}</Typography>
                                  {group.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {group.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={group.is_public ? 'Public' : 'Private'}
                                      size="small"
                                      color={group.is_public ? 'primary' : 'default'}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      Posts ({posts.length})
                    </Typography>
                    {posts.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No posts found
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {posts.map((post) => (
                          <Card
                            key={post.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/posts/${post.id}`)}
                          >
                            <CardHeader
                              avatar={
                                <Avatar src={post.profiles?.avatar_url || undefined}>
                                  {post.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                              }
                              title={post.profiles?.display_name || 'Unknown User'}
                              subheader={formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                              })}
                            />
                            <CardContent>
                              <Typography variant="body1">{post.content}</Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  {/* Users Only */}
                  {users.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {users.map((userProfile) => (
                        <Card
                          key={userProfile.id}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/profile/${userProfile.id}`)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={userProfile.avatar_url || undefined}>
                                {userProfile.display_name?.[0]?.toUpperCase() || 'U'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">
                                  {userProfile.display_name || 'No name'}
                                </Typography>
                                {userProfile.bio && (
                                  <Typography variant="body2" color="text.secondary">
                                    {userProfile.bio}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  {/* Groups Only */}
                  {groups.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No groups found
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {groups.map((group) => (
                        <Card
                          key={group.id}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/groups/${group.id}`)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={group.avatar_url || undefined}>
                                <GroupIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">{group.name}</Typography>
                                {group.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {group.description}
                                  </Typography>
                                )}
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    label={group.is_public ? 'Public' : 'Private'}
                                    size="small"
                                    color={group.is_public ? 'primary' : 'default'}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  {/* Posts Only */}
                  {posts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No posts found
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {posts.map((post) => (
                        <Card
                          key={post.id}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/posts/${post.id}`)}
                        >
                          <CardHeader
                            avatar={
                              <Avatar src={post.profiles?.avatar_url || undefined}>
                                {post.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                              </Avatar>
                            }
                            title={post.profiles?.display_name || 'Unknown User'}
                            subheader={formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                          />
                          <CardContent>
                            <Typography variant="body1">{post.content}</Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </TabPanel>
              </>
            )}
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

