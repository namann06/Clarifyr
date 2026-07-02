import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatHistory, getAllUsers, getCurrentUser } from '../api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PaperPlaneRight, Chats, User, ArrowLeft, Warning } from '@phosphor-icons/react';

export default function ChatScreen() {
  const { chatPartnerId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load users with active history or current active partner
  const fetchUsers = async () => {
    if (!currentUser) return;
    try {
      const allUsers = await getAllUsers();
      const contacts = allUsers.filter(u => u.id !== currentUser.id);

      const contactsWithHistory = await Promise.all(
        contacts.map(async (u) => {
          try {
            const history = await getChatHistory(currentUser.id, u.id);
            const hasMessages = history.length > 0;
            const isCurrentActive = chatPartnerId && parseInt(chatPartnerId, 10) === u.id;
            
            if (hasMessages || isCurrentActive) {
              const lastViewedStr = localStorage.getItem(`clarifyr_last_viewed_chat_${currentUser.id}_${u.id}`);
              const lastViewed = lastViewedStr ? new Date(lastViewedStr) : new Date(0);
              const unreadCount = history.filter(
                m => m.senderId === u.id && new Date(m.timestamp) > lastViewed
              ).length;

              return { 
                ...u, 
                lastMessageTime: hasMessages ? new Date(history[history.length - 1].timestamp) : new Date(0),
                lastMessageText: hasMessages ? history[history.length - 1].content : '',
                unreadCount
              };
            }
            return null;
          } catch (e) {
            return null;
          }
        })
      );
      
      const activeContacts = contactsWithHistory
        .filter(c => c !== null)
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      
      setUsers(activeContacts);
      
      if (chatPartnerId) {
        const partnerIdNum = parseInt(chatPartnerId, 10);
        const partner = contacts.find(u => u.id === partnerIdNum);
        if (partner) {
          setActivePartner(partner);
        }
      }
    } catch (err) {
      console.error('Failed to load contact list:', err);
      setError('Could not load inbox contact list.');
    }
  };

  useEffect(() => {
    setLoadingUsers(true);
    fetchUsers().finally(() => setLoadingUsers(false));
  }, [chatPartnerId, currentUser?.id, messages.length]);

  // Update last viewed timestamp when active partner changes
  useEffect(() => {
    if (currentUser && activePartner) {
      localStorage.setItem(`clarifyr_last_viewed_chat_${currentUser.id}_${activePartner.id}`, new Date().toISOString());
      window.dispatchEvent(new Event('chat_read_update'));
    }
  }, [activePartner?.id, currentUser?.id]);

  // WebSockets and REST history integration
  useEffect(() => {
    if (!currentUser || !activePartner) return;

    setLoadingMessages(true);
    setMessages([]);
    setIsConnected(false);

    // 1. Fetch message history
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(currentUser.id, activePartner.id);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load conversation history:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadHistory();

    // 2. Configure STOMP Client
    const client = new Client({
      webSocketFactory: () => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
        return new SockJS(wsUrl);
      },
      connectHeaders: {
        Authorization: `Bearer ${currentUser.token}`
      },
      debug: function (str) {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        setIsConnected(true);
        console.log('STOMP Connection Established');

        // Subscribe to user private queue
        client.subscribe('/user/queue/messages', (message) => {
          const received = JSON.parse(message.body);
          
          // Append message if it belongs to the current conversation
          if (
            (received.senderId === activePartner.id && received.receiverId === currentUser.id) ||
            (received.senderId === currentUser.id && received.receiverId === activePartner.id)
          ) {
            setMessages((prev) => [...prev, received]);
            localStorage.setItem(`clarifyr_last_viewed_chat_${currentUser.id}_${activePartner.id}`, new Date().toISOString());
            window.dispatchEvent(new Event('chat_read_update'));
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('STOMP Connection Disconnected');
      },
      onStompError: (errFrame) => {
        setIsConnected(false);
        console.error('STOMP Broker Error:', errFrame);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [activePartner?.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activePartner) return;

    // Prepare message payload matching MessageRequest
    const chatPayload = {
      senderId: currentUser.id,
      receiverId: activePartner.id,
      content: typedMessage.trim()
    };

    if (stompClient && isConnected) {
      // Send via WebSocket STOMP
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(chatPayload)
      });
      console.log('Message sent via WebSocket');
    } else {
      console.warn('STOMP disconnected, sending message is disabled');
      return;
    }

    // Optimistically add to local messages
    const optimisticMessage = {
      id: Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: activePartner.id,
      receiverName: activePartner.name,
      content: typedMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTypedMessage('');
  };

  const selectContact = (contact) => {
    setActivePartner(contact);
    navigate(`/chat/${contact.id}`);
  };

  if (!currentUser) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem' }}>
        <Warning size={44} weight="bold" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2>Access Denied</h2>
        <p>Please log in to participate in chat sessions.</p>
      </div>
    );
  }

  return (
    <div className="chat-layout-container card" style={{
      display: 'flex',
      height: 'calc(100vh - 170px)',
      padding: 0,
      overflow: 'hidden',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Sidebar - Contacts List */}
      <div className="chat-sidebar" style={{
        width: '300px',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(15, 20, 32, 0.4)'
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Conversations</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingUsers ? (
            <div className="spinner" style={{ margin: '3rem auto' }}></div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No other members registered.
            </div>
          ) : (
            users.map((c) => {
              const isActive = activePartner?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectContact(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(250, 250, 250, 0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="contact-item"
                >
                  <img
                    src={`https://picsum.photos/seed/tutor-${c.id}/120/120`}
                    alt={c.name}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--glass-border)'
                    }}
                  />
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        {c.name}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="unread-badge" style={{ transform: 'scale(0.85)', minWidth: '16px', height: '16px', borderRadius: '8px', fontSize: '0.65rem', padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                      {c.role}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Conversation Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' }}>
        {activePartner ? (
          <>
            {/* Chat Pane Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(15, 20, 32, 0.4)'
            }}>
              <button 
                onClick={() => setActivePartner(null)} 
                className="btn-logout" 
                style={{ display: 'none' }} // can be shown on mobile media-queries
              >
                <ArrowLeft size={18} />
              </button>

              <img
                src={`https://picsum.photos/seed/tutor-${activePartner.id}/120/120`}
                alt={activePartner.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--glass-border)'
                }}
              />
              
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{activePartner.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>{activePartner.role}</span>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'inline-block'
                  }}></span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {isConnected ? 'connected' : 'connecting...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Message Logs */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem'
            }}>
              {loadingMessages ? (
                <div className="spinner" style={{ margin: 'auto' }}></div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Chats size={40} weight="light" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.85rem' }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: isMe ? '2px' : '12px',
                        borderBottomLeftRadius: isMe ? '12px' : '2px',
                        backgroundColor: isMe ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                        color: isMe ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: isMe ? 'none' : '1px solid var(--glass-border)',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        boxShadow: isMe ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
                      }}>
                        {m.content}
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem',
                        padding: '0 0.25rem'
                      }}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Send Input Box */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              gap: '0.75rem',
              backgroundColor: 'rgba(15, 20, 32, 0.4)',
              alignItems: 'center'
            }}>
              <input
                type="text"
                className="form-input"
                placeholder={isConnected ? "Write a message..." : "Connecting to chat..."}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                disabled={!isConnected}
                style={{ flex: 1, fontSize: '0.9rem' }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.65rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={!isConnected || !typedMessage.trim()}
              >
                <PaperPlaneRight size={18} weight="bold" />
              </button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Chats size={56} weight="light" style={{ color: 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto 1rem auto' }} />
            <h3>Select a Conversation</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Choose a contact from the sidebar list to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
