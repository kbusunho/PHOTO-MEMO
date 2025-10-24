import React, { useState, useEffect, useCallback } from 'react';
import { getFeedRestaurants } from '../api/photos'; // 피드 API 호출 함수
import RestaurantCard from '../components/RestaurantCard'; // 카드 재사용
import Pagination from '../components/Pagination'; // 페이지네이션 재사용
import CommentSection from '../components/CommentSection'; // 댓글 섹션 임포트
import { useAuth } from '../context/AuthContext'; // 로그아웃 처리 및 사용자 정보 확인용
import toast, { Toaster } from 'react-hot-toast'; // 알림 라이브러리
import Footer from '../components/Footer'; // Footer 컴포넌트 임포트
import ThemeToggle from '../components/ThemeToggle'; // ThemeToggle 임포트

// HomePage에서 가져온 아이콘들 (FeedPage 헤더용)
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);
const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);
// 홈 아이콘 추가
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
);


function FeedPage({ onViewChange }) { // onViewChange: 페이지 전환 함수 (App.jsx에서 받음)
  const { user, logout, loading: authLoading } = useAuth(); // 사용자 정보, 로그아웃, 인증 로딩 상태
  const [feedRestaurants, setFeedRestaurants] = useState([]); // 피드 맛집 목록
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // const [sortOption, setSortOption] = useState('createdAt_desc'); // 피드 정렬 옵션 (필요시 추가)

  // --- 데이터 로딩 ---
  const fetchFeed = useCallback(async () => {
    if (authLoading) return; // 인증 로딩 중이면 대기
    setLoading(true);
    try {
      // API 호출 시 현재 페이지 전달
      const data = await getFeedRestaurants({ page: currentPage /*, sort: sortOption */ });
      setFeedRestaurants(data.photos);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("피드 로딩 실패:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("세션 만료. 다시 로그인해주세요.");
        logout(); // 로그아웃 처리
      } else {
        toast.error("피드를 불러오는데 실패했습니다.");
      }
      // 실패 시 데이터 초기화
      setFeedRestaurants([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [authLoading, logout, currentPage /*, sortOption */]); // 의존성 배열

  // 페이지 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // --- 이벤트 핸들러 ---
  // 페이지 변경
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // 페이지 변경 시 맨 위로 스크롤
  };

  // 피드 카드의 태그 클릭 (현재는 토스트만 표시)
  const handleFeedTagClick = (tag) => {
      toast(`'#${tag}' 태그 검색 기능은 준비 중입니다.`);
      // 나중에 구현: onViewChange('search', { tag: tag }); // HomePage로 이동하며 검색 실행
  };

  // 작성자 이름 클릭 시 해당 사용자 프로필 페이지로 이동
  const handleAuthorClick = (authorId) => {
      onViewChange('profile', authorId); // App.jsx에 정의된 함수 호출
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) {
        logout();
    }
  };

  // 댓글 추가/삭제 시 피드 목록 상태 업데이트 함수 (CommentSection 콜백용)
  const handleCommentChange = (photoId, updatedComments) => {
      setFeedRestaurants(prevFeed => prevFeed.map(photo => {
          if (photo._id === photoId) {
              // 댓글 수를 업데이트하거나 할 수 있음 (옵션)
              return { ...photo, comments: updatedComments };
          }
          return photo;
      }));
  };

  // --- JSX 렌더링 ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
       {/* react-hot-toast 컨테이너 (App.jsx에서 한번만 렌더링해도 되지만, 페이지별로 둘 수도 있음) */}
       <Toaster position="top-right" />
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            맛집 포토로그
          </h1>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user && ( // user 객체가 있을 때만 내부 버튼 렌더링
                <>
                    {/* 홈 버튼 */}
                    <button
                        onClick={() => onViewChange('home')} // 홈으로 이동
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="내 맛집로그 가기"
                    >
                        <HomeIcon />
                    </button>
                    {/* 사용자 이름/이메일 */}
                    <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
                    {/* 로그아웃 버튼 */}
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors">로그아웃</button>
                </>
            )}
            {/* 테마 토글 */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 피드 페이지 제목 및 설명 */}
       <div className="container mx-auto px-4 md:px-8 pt-8">
            <h1 className="text-3xl font-bold mb-2">탐색</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">다른 사용자들이 공유한 멋진 맛집들을 만나보세요!</p>
             {!loading && !authLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">총 {totalCount}개의 공개된 맛집 기록</p>
             )}
       </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="container mx-auto p-4 md:px-8 flex-grow">
        {(loading || authLoading) && ( // 로딩 중 표시
             <p className="text-center text-gray-500 dark:text-gray-400 py-10">피드를 불러오는 중...</p>
        )}
        {!loading && !authLoading && feedRestaurants.length === 0 && ( // 데이터 없을 때
          <div className="text-center text-gray-500 dark:text-gray-500 py-10">
              <p className="text-lg">아직 공개된 맛집 기록이 없습니다.</p>
              <p>맛집을 기록하고 '공개'로 설정하여 다른 사람들과 공유해보세요!</p>
          </div>
        )}
        {!loading && !authLoading && feedRestaurants.length > 0 && ( // 데이터 있을 때
          <>
             {/* grid 레이아웃과 최소 너비 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {feedRestaurants.map((r) => {
                  // 작성자 정보 버튼 JSX 생성
                  const ownerInfoButton = r.owner ? (
                    <button
                      onClick={() => handleAuthorClick(r.owner._id)}
                      // 스타일 조정: 버튼이 카드 내부 다른 요소와 겹치지 않도록
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                      title={`${r.owner.displayName || r.owner.email}님의 프로필 보기`}
                    >
                      작성자: {r.owner.displayName || r.owner.email}
                    </button>
                  ) : null;

                  return (
                    // 카드 + 댓글 묶음
                    <div key={r._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                      {/* RestaurantCard에 showActions={false}와 ownerInfo 전달 */}
                      <RestaurantCard
                          restaurant={r}
                          showActions={false} // 수정/삭제 버튼 숨김
                          ownerInfo={ownerInfoButton} // 작성자 정보 버튼 전달
                          onTagClick={handleFeedTagClick}
                          // onEdit, onDelete는 전달 안 함
                      />
                      {/* 댓글 섹션 */}
                      <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 mt-auto"> {/* mt-auto 추가 */}
                         <CommentSection
                            photoId={r._id}
                            initialComments={r.comments || []}
                            onCommentAdded={(newComment) => handleCommentChange(r._id, [newComment, ...(r.comments || [])])}
                            onCommentDeleted={(deletedId) => handleCommentChange(r._id, (r.comments || []).filter(c => c._id !== deletedId))}
                          />
                      </div>
                    </div>
                  );
                })}
            </div>
            {/* 페이지네이션 */}
            {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> )}
          </>
        )}
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

export default FeedPage;

