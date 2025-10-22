import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function App() {
  const { user, loading } = useAuth(); // AuthContext에서 사용자 정보와 로딩 상태 가져오기

  // 현재 보여줄 뷰 ('loading', 'landing', 'home', 'profile')와 프로필 ID 상태
  const [currentView, setCurrentView] = useState('loading');
  const [profileUserId, setProfileUserId] = useState(null);

  // URL 해시 변경 및 사용자 로그인 상태 변경 감지
  useEffect(() => {
    // AuthContext가 로딩 중이면 'loading' 상태 유지하고 아무것도 하지 않음
    if (loading) {
      setCurrentView('loading');
      return;
    }

    // 로딩이 끝났으면 라우팅 로직 실행
    const handleNavigation = () => {
      const hash = window.location.hash;

      if (user) { // --- 로그인 상태일 때 ---
        if (hash.startsWith('#/user/')) {
          // 프로필 뷰
          const userId = hash.substring(7);
          setProfileUserId(userId);
          setCurrentView('profile');
        } else {
          // 그 외에는 홈 뷰
          setCurrentView('home');
          setProfileUserId(null);
          // 홈 화면인데 해시가 루트가 아니면 루트로 변경 (뒤로 가기 가능하도록 hash 사용)
          if (hash !== '#/' && hash !== '') {
             window.location.hash = '#/';
          }
        }
      } else { // --- 로그아웃 상태일 때 ---
        setCurrentView('landing'); // 무조건 랜딩 페이지
        setProfileUserId(null);
        // URL에서 해시 제거 (페이지 새로고침 없이)
        if (hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    // 초기 로드 시 및 해시 변경 시 핸들러 실행
    handleNavigation(); // 마운트 시 현재 상태에 맞는 뷰 설정
    window.addEventListener('hashchange', handleNavigation); // 해시 변경 감지 시작

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
    };
  // loading 또는 user 상태가 변경될 때마다 이 effect 재실행
  }, [user, loading]);

  // AuthContext 로딩 중일 때 표시할 화면 (깜빡임 방지)
  if (currentView === 'loading') {
     // 로딩 스피너 등을 여기에 추가할 수 있습니다.
     return <div className="min-h-screen bg-white dark:bg-gray-900"></div>;
  }

  // 현재 뷰 상태에 따라 다른 페이지 컴포넌트 렌더링
  const renderView = () => {
    switch (currentView) {
      case 'profile':
        return <ProfilePage userId={profileUserId} onViewChange={() => window.location.hash = '#/'} />;
      case 'home':
        return <HomePage onViewChange={(view, userId) => window.location.hash = `#/user/${userId}`} />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return <>{renderView()}</>; // 선택된 뷰 렌더링
}

export default App;

