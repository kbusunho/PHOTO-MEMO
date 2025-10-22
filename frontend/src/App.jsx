import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext'; // 인증 상태 및 함수 사용
import LandingPage from './pages/LandingPage.jsx'; // 랜딩 페이지 컴포넌트
import HomePage from './pages/HomePage.jsx'; // 메인 홈 페이지 컴포넌트
import ProfilePage from './pages/ProfilePage.jsx'; // 공개 프로필 페이지 컴포넌트

/**
 * 애플리케이션의 최상위 컴포넌트.
 * URL 해시(#)를 감지하여 현재 보여줄 페이지(뷰)를 결정하고 렌더링합니다.
 */
function App() {
  // AuthContext에서 사용자 로그인 상태(user)와 로딩 상태(loading) 가져오기
  const { user, loading } = useAuth();

  // 현재 보여줄 뷰 상태 ('loading', 'landing', 'home', 'profile')
  const [currentView, setCurrentView] = useState('loading');
  // 프로필 페이지에서 보여줄 사용자의 ID
  const [profileUserId, setProfileUserId] = useState(null);

  // URL 해시 변경 감지 및 뷰 상태 업데이트 로직
  useEffect(() => {
    // 해시 변경 시 실행될 함수
    const handleHashChange = () => {
      const hash = window.location.hash; // 예: #/user/6718d8b...

      if (loading) {
          // AuthContext 로딩 중에는 뷰를 'loading'으로 유지
          setCurrentView('loading');
          return;
      }

      if (user) { // === 사용자가 로그인한 상태 ===
        if (hash.startsWith('#/user/')) {
          // URL이 '#/user/ID' 형태일 경우, 프로필 뷰로 설정
          const userId = hash.substring(7); // '#/user/' 다음의 ID 문자열 추출
          setProfileUserId(userId);
          setCurrentView('profile');
        } else {
          // 그 외의 모든 경로 (예: '#/' 또는 해시 없음)는 홈 뷰로 설정
          setCurrentView('home');
          setProfileUserId(null); // 프로필 ID 초기화
        }
      } else { // === 사용자가 로그아웃한 상태 ===
        // 로그아웃 상태에서는 항상 랜딩 페이지만 표시
        setCurrentView('landing');
        setProfileUserId(null); // 프로필 ID 초기화
      }
    };

    // 컴포넌트 초기 마운트 시 및 해시 변경 시 핸들러 실행
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 정리 (메모리 누수 방지)
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  // user 상태 또는 loading 상태가 변경될 때마다 useEffect 재실행
  }, [user, loading]);

  // AuthContext 로딩 중이거나 뷰 상태가 'loading'일 때 빈 화면 표시 (깜빡임 방지)
  if (currentView === 'loading') {
     return <div className="min-h-screen bg-white dark:bg-gray-900"></div>;
  }

  // 현재 뷰 상태에 따라 렌더링할 컴포넌트 결정
  const renderView = () => {
    switch (currentView) {
      case 'profile':
        // ProfilePage에 userId와 뷰 전환 함수(홈으로 가기) 전달
        return <ProfilePage userId={profileUserId} onViewChange={() => window.location.hash = '#/'} />;
      case 'home':
        // HomePage에 뷰 전환 함수(프로필 보기) 전달
        return <HomePage onViewChange={(view, userId) => window.location.hash = `#/user/${userId}`} />;
      case 'landing':
      default:
        // 랜딩 페이지 렌더링
        return <LandingPage />;
    }
  };

  // 선택된 뷰 컴포넌트 렌더링
  return <>{renderView()}</>;
}

export default App;

