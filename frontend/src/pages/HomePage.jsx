import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel';
import Pagination from '../components/Pagination';
import ThemeToggle from '../components/ThemeToggle';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';

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
  const { user, logout } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 👇 1. 맛집 총 개수를 저장할 상태 추가
  const [totalRestaurants, setTotalRestaurants] = useState(0);

  const [searchParams, setSearchParams] = useState({
    search: '',
    sort: 'createdAt_desc',
    tag: ''
  });
  const [searchInput, setSearchInput] = useState('');


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
      // 👇 2. API 응답에서 totalCount를 받아와 상태 업데이트
      setTotalRestaurants(data.totalCount);
    } catch (error) {
      console.error("맛집 목록을 불러오는 데 실패했습니다.", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
          logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout, searchParams, currentPage]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);


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

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

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

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchInput('');
    setSearchParams({ search: '', sort: 'createdAt_desc', tag: '' });
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
    if (imageFile) {
        data.append('image', imageFile);
    }

    await toast.promise(
      (async () => {
          if (editingRestaurant) {
              await updateRestaurant(editingRestaurant._id, data);
          } else {
              await uploadRestaurant(data);
              setCurrentPage(1);
              setSearchParams({ search: '', sort: 'createdAt_desc', tag: '' });
              setSearchInput('');
          }
          handleCloseModal();
          fetchRestaurants();
      })(),
      {
          loading: '저장 중...',
          success: <b>{editingRestaurant ? '수정되었습니다!' : '저장되었습니다!'}</b>,
          error: (err) => err.response?.data?.message || '저장에 실패했습니다.'
      }
    );
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            toast.success('삭제되었습니다.');
            if (restaurants.length === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            } else {
              fetchRestaurants();
            }
        } catch (error) {
            console.error("삭제에 실패했습니다.", error);
            toast.error(error.response?.data?.message || '삭제 중 오류가 발생했습니다.');
        }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      <Toaster position="top-right" />

      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            맛집 포토로그
          </h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>

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

            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors">로그아웃</button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 pt-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
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

        {/* 👇 여기가 수정된 부분입니다 👇 */}
        <div className="mt-4 flex items-center justify-between gap-2">
            {/* 필터 정보 (왼쪽) */}
            <div>
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
            <div>
              {!loading && (
                <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                  내 맛집 기록: {totalRestaurants}개
                </span>
              )}
            </div>
        </div>
        {/* 👆 여기까지가 수정된 부분입니다 👆 */}

      </div>

      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">맛집 목록을 불러오는 중...</p>
        ) : (
          restaurants.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-500">
                <p className="text-lg">
                  {searchParams.search || searchParams.tag ? '검색 결과가 없습니다.' : '아직 기록된 맛집이 없네요!'}
                </p>
                <p>
                  {!(searchParams.search || searchParams.tag) && '오른쪽 아래의 \'+\' 버튼을 눌러 첫 맛집을 추가해보세요.'}
                </p>
            </div>
          ) : (
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
                {!loading && restaurants.length > 0 && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
          )
        )}
      </main>

      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-20"
        aria-label="새 맛집 추가"
      >
        <PlusIcon />
      </button>

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

      {/* Footer 컴포넌트 추가 */}
      <Footer />
    </div>
  );
}

