'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  TextField,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLayout from '@/components/layout/PageLayout';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('receiver_id, content, created_at')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('sender_id, content, created_at, read')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      const conversationMap = new Map<string, Conversation>();

      // Process sent messages
      sentMessages?.forEach((msg) => {
        if (!conversationMap.has(msg.receiver_id)) {
          conversationMap.set(msg.receiver_id, {
            userId: msg.receiver_id,
            userName: '',
            userAvatar: null,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          });
        }
      });

      // Process received messages
      receivedMessages?.forEach((msg) => {
        const existing = conversationMap.get(msg.sender_id);
        if (existing) {
          if (new Date(msg.created_at) > new Date(existing.lastMessageTime)) {
            existing.lastMessage = msg.content;
            existing.lastMessageTime = msg.created_at;
          }
          if (!msg.read) {
            existing.unreadCount++;
          }
        } else {
          conversationMap.set(msg.sender_id, {
            userId: msg.sender_id,
            userName: '',
            userAvatar: null,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.read ? 0 : 1,
          });
        }
      });

      // Fetch user profiles
      const userIds = Array.from(conversationMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        profiles?.forEach((profile) => {
          const conv = conversationMap.get(profile.id);
          if (conv) {
            conv.userName = profile.display_name || 'Unknown';
            conv.userAvatar = profile.avatar_url;
          }
        });
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (display_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${selectedConversation},receiver_id.eq.${selectedConversation}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter to only messages between current user and selected user
      const filtered = (data || []).filter(
        (msg) =>
          (msg.sender_id === user.id && msg.receiver_id === selectedConversation) ||
          (msg.sender_id === selectedConversation && msg.receiver_id === user.id)
      );

      setMessages(filtered);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', selectedConversation)
        .eq('receiver_id', user.id)
        .eq('read', false);

      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, selectedConversation, fetchConversations]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      const channel = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedConversation},receiver_id=eq.${user?.id}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <ProtectedRoute>
      <PageLayout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Messages
            </Typography>

            <Paper sx={{ mt: 2, display: 'flex', height: '70vh' }}>
              <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
                <List>
                  {conversations.map((conv) => (
                    <ListItem key={conv.userId} disablePadding>
                      <ListItemButton
                        selected={selectedConversation === conv.userId}
                        onClick={() => setSelectedConversation(conv.userId)}
                      >
                        <ListItemAvatar>
                          <Avatar src={conv.userAvatar || undefined}>
                            {conv.userName[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={conv.userName}
                          secondary={conv.lastMessage}
                        />
                        {conv.unreadCount > 0 && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                            }}
                          >
                            {conv.unreadCount}
                          </Box>
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                  <>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                      {messages.map((msg) => (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            justifyContent: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              bgcolor: msg.sender_id === user?.id ? 'primary.main' : 'grey.300',
                              color: msg.sender_id === user?.id ? 'white' : 'text.primary',
                              p: 1.5,
                              borderRadius: 2,
                            }}
                          >
                            <Typography variant="body2">{msg.content}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      <div ref={messagesEndRef} />
                    </Box>
                    <Divider />
                    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="text.secondary">
                      Select a conversation to start messaging
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Container>
      </PageLayout>
    </ProtectedRoute>
  );
}

