import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';
import AdminPanel from '../components/AdminPanel'; // 1. AdminPanel 컴포넌트 임포트

// 아이콘 SVG 컴포넌트
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

// (신규) 관리자 아이콘
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


export default function HomePage() {
  const { user, logout } = useAuth(); 
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  
  // 2. 관리자 패널 모달 상태 추가
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const data = await getRestaurants();
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
    };
    fetchRestaurants();
  }, [logout]);
  
  // --- 이벤트 핸들러 ---
  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠어요?")) {
        logout();
    }
  };
  
  // 맛집 모달 핸들러
  const handleOpenModal = (restaurant = null) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
  };
  
  // 3. 관리자 패널 모달 핸들러 추가
  const handleOpenAdminPanel = () => setShowAdminPanel(true);
  const handleCloseAdminPanel = () => setShowAdminPanel(false);


  const handleSaveRestaurant = async (formData, imageFile) => {
    // ... (기존 맛집 저장 로직 - 변경 없음) ...
    const data = new FormData();
    data.append('name', formData.name);
    data.append('location', formData.location);
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    if (imageFile) {
        data.append('image', imageFile);
    }
    
    try {
        if (editingRestaurant) {
            const updated = await updateRestaurant(editingRestaurant._id, data);
            setRestaurants(restaurants.map(r => r._id === editingRestaurant._id ? updated : r));
        } else {
            const newRestaurant = await uploadRestaurant(data);
            setRestaurants([newRestaurant, ...restaurants]);
        }
        handleCloseModal(); // 성공 시에만 모달 닫기
    } catch (error) {
        console.error("저장에 실패했습니다.", error.response?.data?.message || error.message);
        alert(`저장 중 오류가 발생했습니다: ${error.response?.data?.message || '서버 오류'}`);
        // 에러 발생 시 모달이 닫히지 않도록 throw 제거
    }
  };

  const handleDeleteRestaurant = async (id) => {
    // ... (기존 맛집 삭제 로직 - 변경 없음) ...
    if (window.confirm("정말 이 맛집 기록을 삭제하시겠어요?")) {
        try {
            await deleteRestaurant(id);
            setRestaurants(restaurants.filter(r => r._id !== id));
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
            
            {/* 4. user.role이 'admin'일 때만 회원 관리 버튼 표시 */}
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

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto p-4 md:p-8">
        {/* ... (기존 맛집 목록 렌더링 로직 - 변경 없음) ... */}
        {loading ? (
          <p className="text-center text-gray-400">맛집 목록을 불러오는 중...</p>
        ) : (
          restaurants.length === 0 ? (
            <div className="text-center text-gray-500">
                <p className="text-lg">아직 기록된 맛집이 없네요!</p>
                <p>오른쪽 아래의 '+' 버튼을 눌러 첫 맛집을 추가해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {restaurants.map((r) => (
                <RestaurantCard key={r._id} restaurant={r} onEdit={handleOpenModal} onDelete={handleDeleteRestaurant} />
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

      {/* 맛집 추가/수정 모달 */}
      {isModalOpen && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={handleCloseModal}
          onSave={handleSaveRestaurant}
        />
      )}
      
      {/* 5. 관리자 패널 모달 렌더링 */}
      {showAdminPanel && (
        <AdminPanel onClose={handleCloseAdminPanel} />
      )}
    </div>
  );
}