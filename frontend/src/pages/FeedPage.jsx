import React, { useState, useEffect, useCallback } from 'react';
import { getFeedRestaurants, toggleLike, reportContent } from '../api/photos'; // 피드 API 호출 함수
import RestaurantCard from '../components/RestaurantCard'; // 카드 재사용
import Pagination from '../components/Pagination'; // 페이지네이션 재사용
import CommentSection from '../components/CommentSection'; // 댓글 섹션 임포트
import { useAuth } from '../context/AuthContext'; // 로그아웃 처리 및 사용자 정보 확인용
import toast, { Toaster } from 'react-hot-toast'; // 알림 라이브러리
import Footer from '../components/Footer'; // Footer 컴포넌트 임포트
import ThemeToggle from '../components/ThemeToggle'; // ThemeToggle 임포트
import ReportModal from '../components/ReportModal'; // 신고 모달 임포트
import Skeleton from 'react-loading-skeleton'; // 스켈레톤 임포트
import 'react-loading-skeleton/dist/skeleton.css'; // 스켈레톤 CSS 임포트

// --- 아이콘 SVG ---
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
);
// (다른 아이콘들은 필요시 HomePage.jsx에서 복사)

// --- 스켈레톤 카드 ---
const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
    <Skeleton height={192} />
    <div className="p-4 sm:p-5 flex flex-col flex-grow">
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={16} className="mt-2" />
      <Skeleton width="50%" height={20} className="mt-2 mb-3" />
      <Skeleton count={3} />
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
            <Skeleton width={60} height={28} />
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <Skeleton width="30%" height={20} className="mb-3" />
        <Skeleton width="100%" height={40} />
    </div>
  </div>
);


function FeedPage({ onViewChange }) {
  const { user, logout, loading: authLoading } = useAuth();
  const [feedRestaurants, setFeedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [reportingContent, setReportingContent] = useState(null); // 신고 모달

  // --- 데이터 로딩 ---
  const fetchFeed = useCallback(async () => {
    if (authLoading || !user) {
        setLoading(false);
        setFeedRestaurants([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
    }
    setLoading(true);
    try {
      const data = await getFeedRestaurants({ page: currentPage });
      setFeedRestaurants(data.photos);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("피드 로딩 실패:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("세션 만료. 다시 로그인해주세요.");
        logout();
      } else {
        toast.error("피드를 불러오는데 실패했습니다.");
      }
      setFeedRestaurants([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, logout, currentPage]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // --- 이벤트 핸들러 ---
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const handleFeedTagClick = (tag) => {
      toast(`'#${tag}' 태그 검색 기능은 준비 중입니다.`);
  };

  const handleAuthorClick = (authorId) => {
      onViewChange('profile', authorId);
  };

  // 👇👇👇 === 로그아웃 핸들러 추가 === 👇👇👇
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) {
        logout();
    }
  };
  // 👆👆👆 === 여기까지 === 👆👆👆

  // 댓글 변경 시
  const handleCommentChange = (photoId, updatedComments) => {
      setFeedRestaurants(prevFeed => prevFeed.map(photo => {
          if (photo._id === photoId) {
              return { ...photo, comments: updatedComments };
          }
          return photo;
      }));
  };

  // '좋아요' 핸들러
  const handleToggleLike = async (photoId) => {
      if (!user) { toast.error("로그인이 필요합니다."); return; }
      try {
          const { likeCount, isLikedByCurrentUser } = await toggleLike(photoId);
          setFeedRestaurants(prevRestaurants =>
              prevRestaurants.map(r =>
                  r._id === photoId
                      ? { ...r, likeCount: likeCount, isLikedByCurrentUser: isLikedByCurrentUser }
                      : r
              )
          );
      } catch (error) {
          console.error("좋아요 실패:", error);
          toast.error(error.response?.data?.message || "좋아요 처리에 실패했습니다.");
      }
  };

  // '신고' 핸들러
  const handleOpenReportModal = (targetType, targetId, targetPhotoId) => {
      setReportingContent({ type: targetType, id: targetId, photoId: targetPhotoId });
  };
  const handleCloseReportModal = () => setReportingContent(null);

  const handleReportSubmit = async (reason) => {
      if (!reportingContent || !reason.trim()) {
          toast.error("신고 사유를 입력해주세요.");
          return;
      }
      const promise = reportContent({
          targetType: reportingContent.type,
          targetId: reportingContent.id,
          targetPhotoId: reportingContent.photoId,
          reason: reason.trim()
      });
      
      await toast.promise(promise, {
           loading: '신고 접수 중...',
           success: (data) => {
               handleCloseReportModal();
               return <b>{data.message || '신고가 접수되었습니다.'}</b>;
           },
           error: (err) => err.response?.data?.message || '신고 접수에 실패했습니다.'
      });
  };

  // --- JSX 렌더링 ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
       <Toaster position="top-right" />
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            맛집 포토로그
          </h1>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user && (
                <>
                    <button onClick={() => onViewChange('home')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="내 맛집로그 가기">
                        <HomeIcon />
                    </button>
                    <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
                    {/* 👇 onClick={handleLogout}이 정상적으로 연결됩니다. */}
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors">로그아웃</button>
                </>
            )}
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
        {(authLoading || loading) && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
             </div>
        )}
        {!loading && !authLoading && feedRestaurants.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-500 py-10">
              <p className="text-lg">아직 공개된 맛집 기록이 없습니다.</p>
              <p>맛집을 기록하고 '공개'로 설정하여 다른 사람들과 공유해보세요!</p>
          </div>
        )}
        {!loading && !authLoading && feedRestaurants.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {feedRestaurants.map((r) => {
                  const ownerInfoButton = r.owner ? (
                    <button
                      onClick={() => handleAuthorClick(r.owner._id)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                      title={`${r.owner.displayName || r.owner.email}님의 프로필 보기`}
                    >
                      작성자: {r.owner.displayName || r.owner.email}
                    </button>
                  ) : null;

                  return (
                    <div key={r._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                      <RestaurantCard
                          restaurant={r}
                          showActions={false}
                          ownerInfo={ownerInfoButton}
                          onTagClick={handleFeedTagClick}
                          onToggleLike={() => handleToggleLike(r._id)}
                          onReport={() => handleOpenReportModal('Photo', r._id, r._id)}
                      />
                      <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 mt-auto">
                         <CommentSection
                            photoId={r._id}
                            initialComments={r.comments || []}
                            onCommentAdded={(newComment) => handleCommentChange(r._id, [newComment, ...(r.comments || [])])}
                            onCommentDeleted={(deletedId) => handleCommentChange(r._id, (r.comments || []).filter(c => c._id !== deletedId))}
                            onReportComment={(commentId) => handleOpenReportModal('Comment', commentId, r._id)}
                          />
                      </div>
                    </div>
                  );
                })}
            </div>
            {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> )}
          </>
        )}
      </main>

      {/* 신고 모달 렌더링 */}
      {reportingContent && (
        <ReportModal
            isOpen={!!reportingContent}
            onClose={handleCloseReportModal}
            onSubmit={handleReportSubmit}
            targetType={reportingContent.type}
        />
      )}

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

export default FeedPage;

