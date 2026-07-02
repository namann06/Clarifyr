import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, getAllUsers, getChatHistory, getMySchedule } from '../api';
import { SignOut, UserCircle, BookOpen } from '@phosphor-icons/react';

export default function Navbar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingScheduleCount, setPendingScheduleCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    try {
      const allUsers = await getAllUsers();
      const contacts = allUsers.filter(u => u.id !== currentUser.id);
      
      const histories = await Promise.all(
        contacts.map(async (c) => {
          try {
            const history = await getChatHistory(currentUser.id, c.id);
            const lastViewedStr = localStorage.getItem(`clarifyr_last_viewed_chat_${currentUser.id}_${c.id}`);
            const lastViewed = lastViewedStr ? new Date(lastViewedStr) : new Date(0);
            
            const unread = history.filter(
              m => m.senderId === c.id && new Date(m.timestamp) > lastViewed
            ).length;
            
            return unread;
          } catch (e) {
            return 0;
          }
        })
      );
      
      const totalUnread = histories.reduce((sum, count) => sum + count, 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Failed to calculate unread message count:', err);
    }
  };

  const fetchScheduleCount = async () => {
    if (!currentUser) {
      setPendingScheduleCount(0);
      return;
    }
    try {
      const schedule = await getMySchedule();
      const pending = schedule.filter(b => b.status === 'PENDING').length;
      setPendingScheduleCount(pending);
    } catch (err) {
      console.error('Failed to fetch pending schedule count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchScheduleCount();

    window.addEventListener('chat_read_update', fetchUnreadCount);
    window.addEventListener('schedule_update', fetchScheduleCount);
    
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchScheduleCount();
    }, 10000);

    return () => {
      window.removeEventListener('chat_read_update', fetchUnreadCount);
      window.removeEventListener('schedule_update', fetchScheduleCount);
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    setPendingScheduleCount(0);
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <BookOpen size={24} weight="bold" className="brand-icon" />
          <span>Clarifyr</span>
          <span className="brand-dot">.</span>
        </Link>

        <nav className="navbar-links">
          {currentUser ? (
            <>
              <Link to="/" className="nav-link">Find Tutors</Link>
              <Link to="/schedule" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>My Schedule</span>
                {pendingScheduleCount > 0 && (
                  <span className="unread-badge" style={{ backgroundColor: 'var(--color-warning)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)' }}>
                    {pendingScheduleCount}
                  </span>
                )}
              </Link>
              <Link to="/chat" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="navbar-actions">
          {currentUser ? (
            <div className="user-profile-menu">
              <Link to="/profile" className="user-info" title="View My Profile">
                <UserCircle size={18} weight="bold" className="user-icon" />
                <span className="user-name">{currentUser.name}</span>
                <span className="badge badge-primary user-role">{currentUser.role}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout" title="Log Out">
                <SignOut size={18} weight="bold" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
