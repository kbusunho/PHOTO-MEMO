import React from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage.jsx';
import HomePage from './pages/HomePage.jsx';

function App() {
  const { user } = useAuth();
  return user ? <HomePage /> : <LandingPage />;
}

export default App;