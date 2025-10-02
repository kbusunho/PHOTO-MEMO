import React from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import './App.scss';

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user ? <DashboardPage /> : <LandingPage />}
    </div>
  );
}

export default App;