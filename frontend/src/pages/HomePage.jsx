import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import { deleteMe } from '../api/users.js'; // deleteMe API 임포트
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel';
import Pagination from '../components/Pagination';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer'; // Footer 임포트
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


export default function HomePage() {
  const { user, logout } = useAuth(); // AuthContext에서 user와 logout 함수 가져오기

  // 상태 관리
  const [restaurants, setRestaurants] = useState([]); // 맛집 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 맛집 추가/수정 모달 상태
  const [editingRestaurant, setEditingRestaurant] = useState(null); // 수정 중인 맛집 정보
  const [showAdminPanel, setShowAdminPanel] = useState(false); // 관리자 패널 모달 상태
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [totalRestaurants, setTotalRestaurants] = useState(0); // 맛집 총 개수
  const [searchParams, setSearchParams] = useState({ search: '', sort: 'createdAt_desc', tag: '' }); // 검색/정렬 파라미터
  const [searchInput, setSearchInput] = useState(''); // 검색창 입력값

  // 맛집 목록 불러오기 함수 (useCallback으로 최적화)
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    const paramsToSend = {
      search: searchParams.search,
      tag: searchParams.tag,
      sort: searchParams.sort === 'createdAt_desc' ? undefined : searchParams.sort,
      page: currentPage,
      limit: 12
    };

    try {
      const data = await getRestaurants(paramsToSend);
      setRestaurants(data.photos);
      setTotalPages(data.totalPages);
      setTotalRestaurants(data.totalCount);
    } catch (error) {
      console.error("맛집 목록 로딩 실패:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error("세션 만료. 다시 로그인해주세요.");
          logout();
      } else {
          toast.error("맛집 목록을 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [logout, searchParams, currentPage]);

  // 컴포넌트 마운트 시 및 fetchRestaurants 함수 변경 시 맛집 목록 로드
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) {
        logout();
    }
  };

  // 맛집 추가/수정 모달 열기/닫기 핸들러
  const handleOpenModal = (restaurant = null) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
  };

  // 관리자 패널 열기/닫기 핸들러
  const handleOpenAdminPanel = () => setShowAdminPanel(true);
  const handleCloseAdminPanel = () => setShowAdminPanel(false);

  // 검색 입력 변경 핸들러
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // 검색 제출 핸들러
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, search: searchInput, tag: '' }));
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    setCurrentPage(1);
    setSearchParams(prev => ({ ...prev, sort: e.target.value }));
  };

  // 태그 클릭 핸들러
  const handleTagClick = (tag) => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams(prev => ({ ...prev, search: '', tag: tag }));
  };

  // 필터 초기화 핸들러
  const clearFilters = () => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams({ search: '', sort: 'createdAt_desc', tag: '' });
  };

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // 페이지 변경 시 맨 위로 스크롤
  };

  // 맛집 저장/수정 핸들러
  const handleSaveRestaurant = async (formData, imageFile, tagsArray) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('address', formData.address); // 주소 필드명 확인
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    data.append('tags', JSON.stringify(tagsArray));
    if (imageFile) {
        data.append('image', imageFile);
    }

    await toast.promise(
      (async () => {
          if (editingRestaurant) { // 수정 모드
              await updateRestaurant(editingRestaurant._id, data);
          } else { // 생성 모드
              await uploadRestaurant(data);
              setCurrentPage(1); // 생성 후 1페이지로 이동
              clearFilters(); // 필터 초기화
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

  // 맛집 삭제 핸들러
  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            toast.success('삭제되었습니다.');
            // 현재 페이지의 마지막 항목 삭제 시 이전 페이지로 이동 (선택적)
            if (restaurants.length === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            } else {
              fetchRestaurants(); // 목록 새로고침
            }
        } catch (error) {
            console.error("맛집 삭제 실패:", error);
            toast.error(error.response?.data?.message || '삭제 실패');
        }
    }
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    // 1차 확인
    if (window.confirm("정말 회원 탈퇴를 하시겠습니까?\n모든 맛집 기록이 영구적으로 삭제되며 복구할 수 없습니다.")) {
      // 2차 확인 (중요!)
      const confirmation = prompt("데이터 복구가 불가능함을 이해했으며, 탈퇴를 원하시면 \"탈퇴합니다\"라고 입력해주세요.");
      if (confirmation === "탈퇴합니다") {
        try {
          // 회원 탈퇴 API 호출
          await deleteMe();
          toast.success("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
          logout(); // 로그아웃 처리 (토큰 삭제 및 랜딩 페이지로 리다이렉트)
        } catch (error) {
          console.error("회원 탈퇴 실패:", error);
          toast.error(error.response?.data?.message || "회원 탈퇴 처리 중 오류 발생");
        }
      } else if (confirmation !== null) { // 취소 버튼 누른 게 아닐 때만 메시지 표시
        toast.error("입력이 일치하지 않아 탈퇴가 취소되었습니다.");
      }
    }
  };


  return (
    // 전체 레이아웃 (flex-col, min-h-screen)
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      {/* react-hot-toast 컨테이너 */}
      <Toaster position="top-right" />

      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          {/* 로고/타이틀 */}
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            맛집 포토로그
          </h1>
          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 사용자 이름/이메일 */}
            <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
            {/* 관리자 버튼 (관리자일 때만 보임) */}
            {user.role === 'admin' && (
              <button
                onClick={handleOpenAdminPanel}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors flex items-center space-x-1"
                title="회원 관리"
              >
                <AdminIcon />
                <span className="hidden sm:inline">회원 관리</span>
              </button>
            )}
            {/* 로그아웃 버튼 */}
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors">로그아웃</button>

            {/* 👇 회원 탈퇴 버튼 (관리자가 아닐 때만 보이도록 수정) 👇 */}
            {user.role !== 'admin' && (
              <button
                onClick={handleDeleteAccount}
                className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                title="회원 탈퇴"
              >
                탈퇴
              </button>
            )}

            {/* 테마 토글 버튼 */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 검색/필터 영역 */}
      <div className="container mx-auto px-4 md:px-8 pt-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* 검색 폼 */}
          <form onSubmit={handleSearchSubmit} className="flex-grow w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="맛집 이름, 위치, 메모, 태그 검색..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <SearchIcon />
              </span>
            </div>
          </form>
          {/* 정렬 드롭다운 */}
          <select
            value={searchParams.sort}
            onChange={handleSortChange}
            className="w-full md:w-auto p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
          >
            <option value="createdAt_desc">최신순</option>
            <option value="rating_desc">별점 높은 순</option>
            <option value="rating_asc">별점 낮은 순</option>
            <option value="name_asc">이름 오름차순</option>
          </select>
        </div>
        {/* 필터 정보 및 총 개수 표시 */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* 필터 정보 (왼쪽) */}
          <div className="flex-shrink-0">
            {(searchParams.search || searchParams.tag) && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchParams.tag ? `'#${searchParams.tag}' 태그 검색 결과` : `'${searchParams.search}' 검색 결과`}
                </span>
                <button onClick={clearFilters} className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-300">
                  (필터 지우기)
                </button>
              </div>
            )}
          </div>
          {/* 맛집 총 개수 (오른쪽) */}
          <div className="flex-shrink-0">
            {!loading && (
              <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                내 맛집 기록: {totalRestaurants}개
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 (flex-grow로 푸터 밀어내기) */}
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {/* 로딩 상태 표시 */}
        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">맛집 목록을 불러오는 중...</p>
        )}
        {/* 데이터 없을 때 메시지 표시 */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-500 py-10">
              <p className="text-lg">
                {searchParams.search || searchParams.tag ? '검색 결과가 없습니다.' : '아직 기록된 맛집이 없네요!'}
              </p>
              <p>
                {!(searchParams.search || searchParams.tag) && '오른쪽 아래의 \'+\' 버튼을 눌러 첫 맛집을 추가해보세요.'}
              </p>
          </div>
        )}
        {/* 맛집 카드 목록 및 페이지네이션 */}
        {!loading && restaurants.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {restaurants.map((r) => (
                <RestaurantCard
                  key={r._id}
                  restaurant={r}
                  onEdit={handleOpenModal}
                  onDelete={handleDeleteRestaurant}
                  onTagClick={handleTagClick}
                />
                ))}
            </div>
            {/* 페이지네이션 (1페이지 초과 시) */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      {/* 새 맛집 추가 버튼 (Floating Action Button) */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-20"
        aria-label="새 맛집 추가"
      >
        <PlusIcon />
      </button>

      {/* 모달 컴포넌트들 (조건부 렌더링) */}
      {isModalOpen && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={handleCloseModal}
          onSave={handleSaveRestaurant}
        />
      )}
      {showAdminPanel && (
        <AdminPanel
          currentUser={user}
          onClose={handleCloseAdminPanel}
        />
      )}

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

