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
    const handleNavigation = () => {
      const hash = window.location.hash;

      if (loading) {
        // AuthContext가 로딩 중일 때는 아무것도 하지 않음
        setCurrentView('loading');
        return;
      }

      if (user) { // 로그인 상태일 때
        if (hash.startsWith('#/user/')) {
          const userId = hash.substring(7);
          setProfileUserId(userId);
          setCurrentView('profile');
        } else {
          // 로그인 상태이고 특별한 경로가 아니면 홈으로
          setCurrentView('home');
          setProfileUserId(null);
          // 홈 화면일 때 해시를 강제로 #/ 로 변경 (선택 사항)
          if (hash !== '#/' && hash !== '') {
             window.location.hash = '#/';
          }
        }
      } else { // 로그아웃 상태일 때
        // 로그아웃 상태에서는 항상 랜딩 페이지
        setCurrentView('landing');
        setProfileUserId(null);
        // 로그아웃 시 해시 제거 (선택 사항)
        if (hash) {
            // 브라우저 히스토리 변경 없이 URL만 정리
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    // 초기 로드 시 및 해시 변경 시 핸들러 실행
    handleNavigation(); // 초기 뷰 설정
    window.addEventListener('hashchange', handleNavigation); // 해시 변경 감지

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
    };
  // 👇 의존성 배열에 loading과 user 추가 (이 값들이 변할 때마다 뷰를 다시 결정해야 함)
  }, [user, loading]);

  // AuthContext 로딩 중 화면
  if (currentView === 'loading') {
     return <div className="min-h-screen bg-white dark:bg-gray-900"></div>; // 로딩 중 빈 화면
  }

  // 현재 뷰 상태에 따라 다른 페이지 컴포넌트 렌더링
  const renderView = () => {
    switch (currentView) {
      case 'profile':
        // ProfilePage에 userId와 뷰 전환(홈으로 가기) 함수 전달
        return <ProfilePage userId={profileUserId} onViewChange={() => window.location.hash = '#/'} />;
      case 'home':
        // HomePage에 뷰 전환(프로필 보기) 함수 전달
        return <HomePage onViewChange={(view, userId) => window.location.hash = `#/user/${userId}`} />;
      case 'landing':
      default:
        // LandingPage 렌더링
        return <LandingPage />;
    }
  };

  return <>{renderView()}</>; // 선택된 뷰 렌더링
}

export default App;

