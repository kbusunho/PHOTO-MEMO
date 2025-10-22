import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import { deleteMe } from '../api/users.js';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel';
import Pagination from '../components/Pagination';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import toast, { Toaster } from 'react-hot-toast';

// 아이콘 SVG 컴포넌트
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
// 가격대 옵션 (백엔드 모델과 일치)
const PRICE_RANGE_OPTIONS = ['₩', '₩₩', '₩₩₩', '₩₩₩₩'];
const PRICE_RANGE_LABELS = { '₩': '만원 이하', '₩₩': '1~3만원', '₩₩₩': '3~5만원', '₩₩₩₩': '5만원 이상' };


export default function HomePage({ onViewChange }) { // App.jsx로부터 onViewChange 함수 받음
  const { user, logout } = useAuth();

  // --- 상태 관리 ---
  const [restaurants, setRestaurants] = useState([]); // 맛집 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 맛집 추가/수정 모달
  const [editingRestaurant, setEditingRestaurant] = useState(null); // 수정할 맛집 데이터
  const [showAdminPanel, setShowAdminPanel] = useState(false); // 관리자 패널 모달
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [totalRestaurants, setTotalRestaurants] = useState(0); // 총 맛집 개수 (필터링된)
  const [searchInput, setSearchInput] = useState(''); // 검색창 입력값
  const [searchParams, setSearchParams] = useState({ // API 요청 파라미터
    search: '',
    sort: 'createdAt_desc',
    tag: '',
    visited: undefined, // undefined: 전체, 'true': 방문, 'false': 위시리스트
    priceRange: '', // 예: '₩₩'
  });

  // --- 데이터 로딩 ---
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    // API로 보낼 파라미터 정리 (빈 값은 보내지 않음)
    const paramsToSend = {
      search: searchParams.search || undefined,
      tag: searchParams.tag || undefined,
      sort: searchParams.sort === 'createdAt_desc' ? undefined : searchParams.sort,
      page: currentPage,
      limit: 12,
      visited: searchParams.visited, // undefined, 'true', 'false' 그대로 전달
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
    } finally {
      setLoading(false);
    }
  }, [logout, searchParams, currentPage]);

  // searchParams나 currentPage가 변경되면 데이터 다시 로드
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // --- 이벤트 핸들러 ---
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) {
        logout();
    }
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

  // 검색 실행 (Enter 또는 버튼 클릭)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, search: searchInput, tag: '' })); // 검색 시 태그 필터 해제
  };

  // 정렬 변경
  const handleSortChange = (e) => {
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, sort: e.target.value }));
  };

  // 태그 클릭 (필터링)
  const handleTagClick = (tag) => {
    setCurrentPage(1);
    setSearchInput(''); // 검색창 비우기
    setSearchParams(prev => ({ ...prev, search: '', tag: tag }));
  };

  // 방문 여부 필터 변경 (전체 / 방문 / 위시리스트)
  const handleVisitedFilterChange = (value) => { // value: undefined, 'true', 'false'
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, visited: value }));
  };

  // 가격대 필터 변경
  const handlePriceFilterChange = (value) => { // value: '' 또는 '₩', '₩₩' 등
      setCurrentPage(1);
      setSearchParams(prev => ({ ...prev, priceRange: value }));
  };

  // 모든 필터 초기화
  const clearFilters = () => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams({ search: '', sort: 'createdAt_desc', tag: '', visited: undefined, priceRange: '' });
  };

  // 페이지 변경
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // 페이지 변경 시 맨 위로 스크롤
   };

  // 맛집 저장/수정
  const handleSaveRestaurant = async (formData, imageFile, tagsArray) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address);
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    data.append('tags', JSON.stringify(tagsArray));
    data.append('visited', formData.visited); // 'true'/'false' 문자열 전달
    data.append('isPublic', formData.isPublic); // 'true'/'false' 문자열 전달
    data.append('priceRange', formData.priceRange); // 가격대 문자열 전달
    if (imageFile) {
        data.append('image', imageFile);
    }

    // react-hot-toast를 사용하여 API 호출 상태 표시
    await toast.promise(
      (async () => {
          if (editingRestaurant) { // 수정 모드
              await updateRestaurant(editingRestaurant._id, data);
          } else { // 생성 모드
              await uploadRestaurant(data);
              setCurrentPage(1); // 생성 후 1페이지로 이동
              clearFilters(); // 필터 초기화 (새 글은 필터 없이 보여야 함)
          }
          handleCloseModal(); // 성공 시 모달 닫기
          fetchRestaurants(); // 목록 새로고침
      })(),
      { // react-hot-toast 옵션
          loading: '저장 중...',
          success: <b>{editingRestaurant ? '수정 완료!' : '저장 완료!'}</b>,
          error: (err) => err.response?.data?.message || '저장 실패'
      }
    );
  };

  // 맛집 삭제
  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            toast.success('삭제되었습니다.');
            // 현재 페이지의 마지막 항목 삭제 시 이전 페이지로 이동 (선택적)
            if (restaurants.length === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1); // 상태 변경으로 useEffect -> fetchRestaurants 호출됨
            } else {
              fetchRestaurants(); // 목록 새로고침
            }
        } catch (error) {
            console.error("맛집 삭제 실패:", error);
            toast.error(error.response?.data?.message || '삭제 실패');
        }
    }
   };

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    // 1차 확인
    if (window.confirm("정말 회원 탈퇴를 하시겠습니까?\n모든 맛집 기록이 영구적으로 삭제되며 복구할 수 없습니다.")) {
      // 2차 확인 (중요!)
      const confirmation = prompt("데이터 복구가 불가능함을 이해했으며, 탈퇴를 원하시면 \"탈퇴합니다\"라고 입력해주세요.");
      if (confirmation === "탈퇴합니다") {
        try {
          await deleteMe(); // 회원 탈퇴 API 호출
          toast.success("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
          logout(); // 로그아웃 처리
        } catch (error) {
          console.error("회원 탈퇴 실패:", error);
          toast.error(error.response?.data?.message || "회원 탈퇴 처리 중 오류 발생");
        }
      } else if (confirmation !== null) { // 취소 버튼 누른 게 아닐 때만 메시지 표시
        toast.error("입력이 일치하지 않아 탈퇴가 취소되었습니다.");
      }
    }
   };

  // 필터 초기화 버튼 표시 여부 계산
  const showClearButton = searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange;


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
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
            {user.role === 'admin' && (
              <button onClick={handleOpenAdminPanel} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors flex items-center space-x-1" title="회원 관리">
                <AdminIcon />
                <span className="hidden sm:inline">회원 관리</span>
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors">로그아웃</button>
            {user.role !== 'admin' && (
              <button onClick={handleDeleteAccount} className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors" title="회원 탈퇴">
                탈퇴
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 검색 / 필터 영역 */}
      <div className="container mx-auto px-4 md:px-8 pt-6 sm:pt-8">
        {/* 상단: 검색창, 정렬 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearchSubmit} className="flex-grow w-full md:w-auto">
            <div className="relative">
              <input type="text" placeholder="맛집 이름, 위치, 메모, 태그 검색..." value={searchInput} onChange={handleSearchInputChange} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><SearchIcon /></span>
            </div>
          </form>
          <select value={searchParams.sort} onChange={handleSortChange} className="w-full md:w-auto p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
            <option value="createdAt_desc">최신순</option>
            <option value="rating_desc">별점 높은 순</option>
            <option value="rating_asc">별점 낮은 순</option>
            <option value="name_asc">이름 오름차순</option>
            <option value="price_asc">가격 낮은 순</option>
            <option value="price_desc">가격 높은 순</option>
          </select>
        </div>

        {/* 하단: 방문/위시리스트 탭, 가격대 필터 */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 flex space-x-1">
                <button onClick={() => handleVisitedFilterChange(undefined)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${searchParams.visited === undefined ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 전체 </button>
                <button onClick={() => handleVisitedFilterChange('true')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${searchParams.visited === 'true' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 방문한 곳 </button>
                 <button onClick={() => handleVisitedFilterChange('false')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${searchParams.visited === 'false' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}> 가고싶은 곳 </button>
            </div>
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 flex items-center">
                 <select value={searchParams.priceRange} onChange={(e) => handlePriceFilterChange(e.target.value)} className="w-full sm:w-auto p-1.5 bg-transparent dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-sm">
                    <option value="">-- 가격대 --</option>
                    {PRICE_RANGE_OPTIONS.map(option => ( <option key={option} value={option}>{option} ({PRICE_RANGE_LABELS[option]})</option> ))}
                  </select>
            </div>
        </div>

        {/* 필터 정보 및 총 개수 표시 */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {searchParams.search && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">검색: '{searchParams.search}'</span> )}
            {searchParams.tag && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">태그: '#{searchParams.tag}'</span> )}
            {searchParams.priceRange && ( <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">가격대: {searchParams.priceRange}</span> )}
            {showClearButton && ( <button onClick={clearFilters} className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline ml-1"> (모든 필터 지우기) </button> )}
          </div>
          <div className="flex-shrink-0 mt-2 sm:mt-0">
            {!loading && ( <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold"> {showClearButton ? '필터 결과: ' : '내 맛집 기록: '} {totalRestaurants}개 </span> )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="container mx-auto p-4 md:px-8 flex-grow">
        {loading && ( <p className="text-center text-gray-500 dark:text-gray-400 py-10">맛집 목록을 불러오는 중...</p> )}
        {!loading && restaurants.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-500 py-10">
              <p className="text-lg"> {searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange ? '검색 결과가 없습니다.' : '아직 기록된 맛집이 없네요!'} </p>
              <p> {!(searchParams.search || searchParams.tag || searchParams.visited !== undefined || searchParams.priceRange) && '오른쪽 아래의 \'+\' 버튼을 눌러 첫 맛집을 추가해보세요.'} </p>
          </div>
        )}
        {!loading && restaurants.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {restaurants.map((r) => (
                <RestaurantCard key={r._id} restaurant={r} onEdit={handleOpenModal} onDelete={handleDeleteRestaurant} onTagClick={handleTagClick} />
                ))}
            </div>
            {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> )}
          </>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => handleOpenModal()} className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-20" aria-label="새 맛집 추가"> <PlusIcon /> </button>

      {/* 모달들 */}
      {isModalOpen && ( <RestaurantFormModal restaurant={editingRestaurant} onClose={handleCloseModal} onSave={handleSaveRestaurant} /> )}
      {showAdminPanel && ( <AdminPanel currentUser={user} onClose={handleCloseAdminPanel} onViewProfile={(userId) => onViewChange('profile', userId)} /> )}

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

