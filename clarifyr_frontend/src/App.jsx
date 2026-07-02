import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginScreen from './screens/LoginScreen';
import TutorListScreen from './screens/TutorListScreen';
import TutorProfileScreen from './screens/TutorProfileScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import { getCurrentUser } from './api';

// Protected Route Wrapper Component
function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  const isAuth = !!(user && user.token);
  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<TutorListScreen />} />
            <Route path="/tutors/:id" element={<TutorProfileScreen />} />
            
            {/* Protected Routes */}
            <Route 
              path="/schedule" 
              element={
                <ProtectedRoute>
                  <ScheduleScreen />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatScreen />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat/:chatPartnerId" 
              element={
                <ProtectedRoute>
                  <ChatScreen />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              } 
            />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginScreen />} />
            
            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
