import React from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage.jsx';
import HomePage from './pages/HomePage.jsx';

function App() {
  const { user } = useAuth();
  
  const { loading } = useAuth();
  if (loading) {
     return <div className="min-h-screen bg-gray-900"></div>; // 로딩 중 화면 (깜빡임 방지)
  }

  return user ? <HomePage /> : <LandingPage />;
}

export default App;