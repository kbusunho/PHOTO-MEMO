import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
// 👇 toggleLike, reportContent API 임포트
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant, toggleLike, reportContent } from '../api/photos.js';
import { deleteMe } from '../api/users.js';
import PasswordChangeModal from '../components/PasswordChangeModal';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel';
import Pagination from '../components/Pagination';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns'; // 👇 방문 날짜 포맷용
import Skeleton from 'react-loading-skeleton'; // 👇 스켈레톤 임포트
import 'react-loading-skeleton/dist/skeleton.css'; // 👇 스켈레톤 CSS 임포트
import ReportModal from '../components/ReportModal'; // 👇 신고 모달 임포트

// --- 아이콘 SVG 컴포넌트 ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);
const GlobeAltIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.33 6.182a.75.75 0 011.062-.276 5.513 5.513 0 007.216 0 .75.75 0 11.786-1.282A7.013 7.013 0 0110 5.25c-1.385 0-2.684-.39-3.79-.068a.75.75 0 01-.275 1.06zm1.22 6.44a.75.75 0 01.666 1.286A5.513 5.513 0 0010 14.75a5.513 5.513 0 002.784-.812.75.75 0 11.62-1.372 7.013 7.013 0 01-6.808 0zM15 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM6.5 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd" />
    </svg>
);
// (신규) 로그아웃/탈퇴 아이콘
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// 가격대 옵션
const PRICE_RANGE_OPTIONS = ['₩', '₩₩', '₩₩₩', '₩₩₩₩'];
const PRICE_RANGE_LABELS = { '₩': '만원 이하', '₩₩': '1~3만원', '₩₩₩': '3~5만원', '₩₩₩₩': '5만원 이상' };

// 스켈레톤 카드
const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
    <Skeleton height={192} />
    <div className="p-4 sm:p-5 flex flex-col flex-grow">
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={16} className="mt-2" />
      <Skeleton width="50%" height={20} className="mt-2 mb-3" />
      <Skeleton count={3} />
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
            <Skeleton width={60} height={28} />
            <Skeleton width={110} height={28} />
        </div>
      </div>
    </div>
  </div>
);


export default function HomePage({ onViewChange }) {
  const { user, logout, loading: authLoading } = useAuth();

  // --- 상태 관리 ---
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchParams, setSearchParams] = useState({
    search: '',
    sort: 'createdAt_desc',
    tag: '',
    visited: undefined,
    priceRange: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [reportingContent, setReportingContent] = useState(null);

  // --- 데이터 로딩 ---
  const fetchRestaurants = useCallback(async () => {
    if (authLoading || !user) {
        setLoading(false);
        setRestaurants([]);
        setTotalPages(1);
        setTotalRestaurants(0);
        return;
    }
    setLoading(true);
    const paramsToSend = {
      search: searchParams.search || undefined,
      tag: searchParams.tag || undefined,
      sort: searchParams.sort === 'createdAt_desc' ? undefined : searchParams.sort,
      page: currentPage,
      limit: 12,
      visited: searchParams.visited,
      priceRange: searchParams.priceRange || undefined,
    };
    try {
      const data = await getRestaurants(paramsToSend);
      setRestaurants(data.photos);
      setTotalPages(data.totalPages);
      setTotalRestaurants(data.totalCount);
    } catch (error) {
      console.error("맛집 목록 로딩 실패:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error("세션 만료. 다시 로그인해주세요.");
          logout();
      } else {
          toast.error("맛집 목록 로딩 실패");
      }
      setRestaurants([]);
      setTotalPages(1);
      setTotalRestaurants(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, logout, searchParams, currentPage]);

  // --- 데이터 로딩 Effect ---
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // --- 이벤트 핸들러 ---
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) { logout(); }
  };
  const handleOpenModal = (restaurant = null) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
  };
  const handleOpenAdminPanel = () => setShowAdminPanel(true);
  const handleCloseAdminPanel = () => setShowAdminPanel(false);
  const handleSearchInputChange = (e) => { setSearchInput(e.target.value); };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, search: searchInput, tag: '' }));
  };
  const handleSortChange = (e) => {
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, sort: e.target.value }));
  };
  const handleTagClick = (tag) => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams(prev => ({ ...prev, search: '', tag: tag }));
  };
  const handleVisitedFilterChange = (value) => {
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, visited: value }));
  };
  const handlePriceFilterChange = (value) => {
      setCurrentPage(1);
      setSearchParams(prev => ({ ...prev, priceRange: value }));
  };
  const clearFilters = () => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams({ search: '', sort: 'createdAt_desc', tag: '', visited: undefined, priceRange: '' });
  };
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };
  const handleSaveRestaurant = async (formData, imageFile, tagsArray) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    data.append('tags', JSON.stringify(tagsArray));
    data.append('visited', formData.visited);
    data.append('isPublic', formData.isPublic);
    data.append('priceRange', formData.priceRange);
    if (formData.visited === 'true' && formData.visitedDate) {
        data.append('visitedDate', formData.visitedDate);
    }
    if (imageFile) { data.append('image', imageFile); }

    await toast.promise(
      (async () => {
          if (editingRestaurant) { await updateRestaurant(editingRestaurant._id, data); }
          else { await uploadRestaurant(data); setCurrentPage(1); clearFilters(); }
          fetchRestaurants();
      })(),
      {
          loading: '저장 중...',
          success: (result) => { handleCloseModal(); return <b>{editingRestaurant ? '수정 완료!' : '저장 완료!'}</b>; },
          error: (err) => err.response?.data?.message || '저장 실패'
      }
    );
  };
  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            toast.success('삭제되었습니다.');
            if (restaurants.length === 1 && currentPage > 1) { setCurrentPage(currentPage - 1); }
            else { fetchRestaurants(); }
        } catch (error) {
            console.error("맛집 삭제 실패:", error);
            toast.error(error.response?.data?.message || '삭제 실패');
        }
    }
  };
  const handleDeleteAccount = async () => {
    if (window.confirm("정말 회원 탈퇴를 하시겠습니까?\n모든 맛집 기록이 영구적으로 삭제되며 복구할 수 없습니다.")) {
      const confirmation = prompt("데이터 복구가 불가능함을 이해했으며, 탈퇴를 원하시면 \"탈퇴합니다\"라고 입력해주세요.");
      if (confirmation === "탈퇴합니다") {
        try {
          await deleteMe();
          toast.success("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
          logout();
        } catch (error) {
          console.error("회원 탈퇴 실패:", error);
          toast.error(error.response?.data?.message || "회원 탈퇴 처리 중 오류 발생");
        }
      } else if (confirmation !== null) {
        toast.error("입력이 일치하지 않아 탈퇴가 취소되었습니다.");
      }
    }
  };
  const handleOpenPasswordModal = () => setShowPasswordModal(true);
  const handleClosePasswordModal = () => setShowPasswordModal(false);
  
  const handleToggleLike = async (photoId) => {
      if (!user) { toast.error("로그인이 필요합니다."); return; }
      try {
          const { likeCount, isLikedByCurrentUser } = await toggleLike(photoId);
          setRestaurants(prevRestaurants =>
              prevRestaurants.map(r =>
                  r._id === photoId ? { ...r, likeCount: likeCount, isLikedByCurrentUser: isLikedByCurrentUser } : r
              )
          );
      } catch (error) {
          console.error("좋아요 실패:", error);
          toast.error(error.response?.data?.message || "좋아요 처리에 실패했습니다.");
      }
  };

  const handleOpenReportModal = (targetType, targetId, targetPhotoId) => {
      setReportingContent({ type: targetType, id: targetId, photoId: targetPhotoId });
  };
  const handleCloseReportModal = () => setReportingContent(null);

  const handleReportSubmit = async (reason) => {
      if (!reportingContent || !reason.trim()) { toast.error("신고 사유를 입력해주세요."); return; }
      const promise = reportContent({
          targetType: reportingContent.type,
          targetId: reportingContent.id,
          targetPhotoId: reportingContent.photoId,
          reason: reason.trim()
      });
      await toast.promise(promise, {
           loading: '신고 접수 중...',
           success: (data) => { handleCloseReportModal(); return <b>{data.message || '신고가 접수되었습니다.'}</b>; },
           error: (err) => err.response?.data?.message || '신고 접수에 실패했습니다.'
      });
  };

  const showClearButton = searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange;

  // --- JSX 렌더링 ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      <Toaster position="top-right" />

      {/* --- 헤더 (모바일 반응형 수정됨) --- */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            맛집 포토로그
          </h1>
          {/* 👇 space-x-1 sm:space-x-2 (모바일에서 버튼 간격 줄임) */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user && (
                <>
                    {/* 👇 lg:block (아주 넓은 화면에서만 이름 표시) */}
                    <span className="text-gray-500 dark:text-gray-400 text-sm hidden lg:block">{user.displayName || user.email}</span>
                    {/* 탐색 버튼 (아이콘) */}
                    <button onClick={() => onViewChange('feed')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="탐색">
                        <GlobeAltIcon />
                    </button>
                    {/* 관리자 버튼 (아이콘) */}
                    {user.role === 'admin' && (
                      <button onClick={handleOpenAdminPanel} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="회원 관리">
                        <AdminIcon />
                      </button>
                    )}
                    {/* 비밀번호 변경 (아이콘) */}
                    <button onClick={handleOpenPasswordModal} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="비밀번호 변경">
                        <CogIcon />
                    </button>
                    {/* 로그아웃 버튼 (아이콘 + sm부터 텍스트) */}
                    <button onClick={handleLogout} className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors">
                        <LogoutIcon />
                        <span className="hidden sm:inline">로그아웃</span>
                    </button>
                    {/* 탈퇴 버튼 (아이콘 + sm부터 텍스트) */}
                    {user.role !== 'admin' && (
                      <button onClick={handleDeleteAccount} className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors" title="회원 탈퇴">
                        <TrashIcon />
                        <span className="hidden sm:inline">탈퇴</span>
                      </button>
                    )}
                </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* --- 검색 / 필터 영역 (모바일 반응형 수정) --- */}
      <div className="container mx-auto px-4 md:px-8 pt-6 sm:pt-8">
         {/* 상단: 검색창, 정렬 (md:flex-row -> 좁은 화면에서 세로, 넓은 화면에서 가로) */}
         <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
           <form onSubmit={handleSearchSubmit} className="flex-grow w-full md:w-auto">
             <div className="relative">
               <input type="text" placeholder="맛집 이름, 위치, 메모, 태그 검색..." value={searchInput} onChange={handleSearchInputChange} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><SearchIcon /></span>
             </div>
           </form>
           <select value={searchParams.sort} onChange={handleSortChange} className="w-full md:w-auto p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
             <option value="createdAt_desc">최신순</option>
             <option value="likes_desc">좋아요순</option>
             <option value="visitedDate_desc">방문 날짜순 (최신)</option>
             <option value="visitedDate_asc">방문 날짜순 (오래된)</option>
             <option value="rating_desc">별점 높은 순</option>
             <option value="rating_asc">별점 낮은 순</option>
             <option value="name_asc">이름 오름차순</option>
             <option value="price_asc">가격 낮은 순</option>
             <option value="price_desc">가격 높은 순</option>
           </select>
         </div>

         {/* 👇 하단: 필터들 (flex-wrap으로 좁은 화면에서 줄바꿈) */}
         <div className="mt-4 flex flex-wrap gap-4 items-center">
             {/* 방문/위시리스트 탭 */}
             <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 flex flex-wrap gap-1">
                 <button onClick={() => handleVisitedFilterChange(undefined)} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${searchParams.visited === undefined ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 전체 </button>
                 <button onClick={() => handleVisitedFilterChange('true')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${searchParams.visited === 'true' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 방문한 곳 </button>
                  <button onClick={() => handleVisitedFilterChange('false')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${searchParams.visited === 'false' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 가고싶은 곳 </button>
             </div>
             {/* 가격대 필터 */}
             <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 flex items-center">
                  <select value={searchParams.priceRange} onChange={(e) => handlePriceFilterChange(e.target.value)} className="w-full sm:w-auto p-1.5 bg-transparent dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-xs sm:text-sm">
                     <option value="">-- 가격대 --</option>
                     {PRICE_RANGE_OPTIONS.map(option => ( <option key={option} value={option}>{option} ({PRICE_RANGE_LABELS[option]})</option> ))}
                   </select>
             </div>
         </div>


         {/* 👇 필터 정보 및 총 개수 (md:flex-row -> 좁은 화면에서 세로, 넓은 화면에서 가로) */}
         <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
           <div className="flex items-center gap-2 flex-wrap">
             {searchParams.search && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">검색: '{searchParams.search}'</span> )}
             {searchParams.tag && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">태그: '#{searchParams.tag}'</span> )}
             {searchParams.priceRange && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">가격대: {searchParams.priceRange}</span> )}
             {showClearButton && ( <button onClick={clearFilters} className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline ml-1"> (모든 필터 지우기) </button> )}
           </div>
           <div className="flex-shrink-0 mt-2 md:mt-0">
             {!authLoading && !loading && user && ( <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold"> {showClearButton ? '필터 결과: ' : '내 맛집 기록: '} {totalRestaurants}개 </span> )}
           </div>
         </div>
       </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="container mx-auto p-4 md:px-8 flex-grow">
         {(authLoading || loading) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
         )}
         {!authLoading && !loading && user && restaurants.length === 0 && (
           <div className="text-center text-gray-500 dark:text-gray-500 py-10">
               <p className="text-lg"> {searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange ? '검색 결과가 없습니다.' : '아직 기록된 맛집이 없네요!'} </p>
               <p> {!(searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange) && '오른쪽 아래의 \'+\' 버튼을 눌러 첫 맛집을 추가해보세요.'} </p>
           </div>
         )}
         {!authLoading && !loading && user && restaurants.length > 0 && (
           <>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                 {restaurants.map((r) => (
                 <RestaurantCard
                   key={r._id}
                   restaurant={r}
                   onEdit={handleOpenModal}
                   onDelete={handleDeleteRestaurant}
                   onTagClick={handleTagClick}
                   showActions={true}
                   onToggleLike={() => handleToggleLike(r._id)}
                   onReport={() => handleOpenReportModal('Photo', r._id, r._id)}
                   onReportComment={(commentId) => handleOpenReportModal('Comment', commentId, r._id)} // 댓글 신고
                 />
                 ))}
             </div>
             {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> )}
           </>
         )}
       </main>

      {/* FAB (로그인 상태일 때만 표시) */}
      {user && (
          <button onClick={() => handleOpenModal()} className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-20" aria-label="새 맛집 추가"> <PlusIcon /> </button>
      )}

      {/* 모달들 (로그인 상태일 때만 표시) */}
      {user && isModalOpen && ( <RestaurantFormModal restaurant={editingRestaurant} onClose={handleCloseModal} onSave={handleSaveRestaurant} /> )}
      {user && showAdminPanel && ( <AdminPanel currentUser={user} onClose={handleCloseAdminPanel} onViewProfile={(userId) => onViewChange('profile', userId)} /> )}
      {user && showPasswordModal && ( <PasswordChangeModal onClose={handleClosePasswordModal} /> )}
      
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

