import React from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage.jsx';
import HomePage from './pages/HomePage.jsx';

function App() {
  const { user } = useAuth();
  
  // AuthContext가 로딩 중일 때(user가 null이고 loading이 true일 때)
  // 아무것도 렌더링하지 않거나 로딩 스피너를 보여줄 수 있습니다.
  // 여기서는 useAuth에서 loading 상태를 반환한다고 가정합니다.
  const { loading } = useAuth();
  if (loading) {
     return <div className="min-h-screen bg-gray-900"></div>; // 로딩 중 화면 (깜빡임 방지)
  }

  return user ? <HomePage /> : <LandingPage />;
}

export default App;