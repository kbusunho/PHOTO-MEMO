import React, { useState, useEffect, useCallback } from 'react'; // useCallback 추가
import { useAuth } from '../context/AuthContext';
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel'; 

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

// 👇 1. 검색 아이콘 추가 👇
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
  
  // 👇 2. 검색/정렬을 위한 상태 추가 👇
  const [searchParams, setSearchParams] = useState({
    search: '',
    sort: 'createdAt_desc', // 백엔드 기본값과 맞춤
    tag: ''
  });
  // 검색창 입력을 위한 별도 상태 (매번 API 호출 방지)
  const [searchInput, setSearchInput] = useState('');

  
  // 👇 3. API 호출 함수 (useCallback으로 감싸기) 👇
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    // searchParams의 'sort'가 'createdAt_desc'가 아니면 API로 보냅니다.
    // 'search'와 'tag'는 비어있으면(falsy) 알아서 무시됩니다.
    const paramsToSend = {
      search: searchParams.search,
      tag: searchParams.tag,
      sort: searchParams.sort === 'createdAt_desc' ? undefined : searchParams.sort
    };
    
    try {
      // 현재 searchParams를 API로 전달
      const data = await getRestaurants(paramsToSend);
      setRestaurants(data);
    } catch (error) {
      console.error("맛집 목록을 불러오는 데 실패했습니다.", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout, searchParams]); // searchParams가 바뀔 때마다 함수 재생성

  // 👇 4. searchParams가 변경될 때마다 fetchRestaurants 호출
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]); // fetchRestaurants가 의존성
  
  
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

  // 👇 5. 검색/정렬 핸들러 추가 👇
  
  // 검색창 입력값 변경
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // 검색 버튼 클릭 또는 Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, search: searchInput, tag: '' })); // tag 필터는 초기화
  };

  // 정렬 드롭다운 변경
  const handleSortChange = (e) => {
    setSearchParams(prev => ({ ...prev, sort: e.target.value }));
  };
  
  // 카드에서 태그 클릭
  const handleTagClick = (tag) => {
    setSearchInput(''); // 검색창 비우기
    setSearchParams(prev => ({ ...prev, search: '', tag: tag }));
  };

  // "필터 지우기" 클릭
  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({ search: '', sort: 'createdAt_desc', tag: '' });
  };
  

  // 👇 6. handleSaveRestaurant 수정 👇
  // 모달에서 tagsArray를 받아옵니다.
  const handleSaveRestaurant = async (formData, imageFile, tagsArray) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('location', formData.location);
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    
    // tagsArray를 JSON 문자열로 변환하여 FormData에 추가
    data.append('tags', JSON.stringify(tagsArray));

    if (imageFile) {
        data.append('image', imageFile);
    }
    
    try {
        if (editingRestaurant) {
            await updateRestaurant(editingRestaurant._id, data);
        } else {
            await uploadRestaurant(data);
        }
        handleCloseModal();
        fetchRestaurants(); // (중요) 저장 후 목록 새로고침
    } catch (error) {
        console.error("저장에 실패했습니다.", error.response?.data?.message || error.message);
        alert(`저장 중 오류가 발생했습니다: ${error.response?.data?.message || '서버 오류'}`);
        throw error; // 모달이 닫히지 않도록 에러를 다시 던짐
    }
  };

  // 👇 7. handleDeleteRestaurant 수정 👇
  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            fetchRestaurants(); // (중요) 삭제 후 목록 새로고침
        } catch (error) {
            console.error("삭제에 실패했습니다.", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* 헤더 */}
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">맛집 포토로그</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
            
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

            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">로그아웃</button>
          </div>
        </div>
      </header>

      {/* 👇 8. 검색/필터 UI 영역 추가 👇 */}
      <div className="container mx-auto px-4 md:px-8 pt-8">
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* 검색 Form */}
          <form onSubmit={handleSearchSubmit} className="flex-grow w-full md:w-auto">
            <div className="relative">
              <input 
                type="text"
                placeholder="맛집 이름, 위치, 메모, 태그 검색..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full p-3 pl-10 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
            </div>
          </form>
          
          {/* 정렬 Dropdown */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <select 
              value={searchParams.sort}
              onChange={handleSortChange}
              className="w-full md:w-auto p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="createdAt_desc">최신순</option>
              <option value="rating_desc">별점 높은 순</option>
              <option value="rating_asc">별점 낮은 순</option>
              <option value="name_asc">이름 오름차순</option>
            </select>
          </div>
        </div>
        
        {/* 현재 필터 상태 표시 */}
        {(searchParams.search || searchParams.tag) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {searchParams.tag ? `'#${searchParams.tag}' 태그 검색 결과` : `'${searchParams.search}' 검색 결과`}
            </span>
            <button onClick={clearFilters} className="text-xs text-indigo-400 hover:text-indigo-300">
              (필터 지우기)
            </button>
          </div>
        )}
      </div>

      <main className="container mx-auto p-4 md:p-8">
        {loading ? (
          <p className="text-center text-gray-400">맛집 목록을 불러오는 중...</p>
        ) : (
          restaurants.length === 0 ? (
            <div className="text-center text-gray-500">
                <p className="text-lg">
                  {searchParams.search || searchParams.tag ? '검색 결과가 없습니다.' : '아직 기록된 맛집이 없네요!'}
                </p>
                <p>
                  {!(searchParams.search || searchParams.tag) && '오른쪽 아래의 \'+\' 버튼을 눌러 첫 맛집을 추가해보세요.'}
                </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {restaurants.map((r) => (
                <RestaurantCard 
                  key={r._id} 
                  restaurant={r} 
                  onEdit={handleOpenModal} 
                  onDelete={handleDeleteRestaurant}
                  onTagClick={handleTagClick} // 👇 9. onTagClick 핸들러 전달
                />
                ))}
            </div>
          )
        )}
      </main>

      {/* 새 맛집 추가 버튼 */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-20"
        aria-label="새 맛집 추가"
      >
        <PlusIcon />
      </button>

      {/* 👇 10. onSave 핸들러 업데이트 👇 */}
      {isModalOpen && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={handleCloseModal}
          onSave={handleSaveRestaurant}
        />
      )}
      
      {/* 관리자 패널 모달 */}
      {showAdminPanel && (
        <AdminPanel 
          currentUser={user}
          onClose={handleCloseAdminPanel} 
        />
      )}
    </div>
  );
}