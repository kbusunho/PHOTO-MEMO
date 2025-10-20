import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// api/photos.js 에서 함수들을 가져옵니다.
import { getRestaurants, uploadRestaurant, updateRestaurant, deleteRestaurant } from '../api/photos.js';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantFormModal from '../components/RestaurantFormModal';

// 아이콘 SVG 컴포넌트
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

export default function HomePage() {
  const { user, logout } = useAuth(); // AuthContext에서 user 정보와 logout 함수 가져오기
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // 컴포넌트 마운트 시 맛집 목록 불러오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("맛집 목록을 불러오는 데 실패했습니다.", error);
        // 토큰 만료 등의 에러일 경우 로그아웃 처리
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            logout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [logout]); // logout을 의존성 배열에 추가
  
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

  const handleSaveRestaurant = async (formData, imageFile) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('location', formData.location);
    data.append('rating', formData.rating);
    data.append('memo', formData.memo);
    
    // 새 이미지 파일이 있을 때만 FormData에 추가
    if (imageFile) {
        data.append('image', imageFile);
    }
    
    try {
        if (editingRestaurant) {
            // 수정 로직 (MongoDB의 _id 사용)
            const updated = await updateRestaurant(editingRestaurant._id, data);
            setRestaurants(restaurants.map(r => r._id === editingRestaurant._id ? updated : r));
        } else {
            // 추가 로직
            const newRestaurant = await uploadRestaurant(data);
            setRestaurants([newRestaurant, ...restaurants]);
        }
    } catch (error) {
        console.error("저장에 실패했습니다.", error.response?.data?.message || error.message);
        alert(`저장 중 오류가 발생했습니다: ${error.response?.data?.message || '서버 오류'}`);
        throw error; // 모달이 닫히지 않도록 에러를 다시 던짐
    } finally {
        handleCloseModal(); // 성공 시에만 모달 닫기
    }
  };

  const handleDeleteRestaurant = async (id) => {
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
            {/* user.displayName이 있으면 그걸, 없으면 email을 표시 */}
            <span className="text-gray-400 text-sm hidden sm:block">{user.displayName || user.email}</span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors">로그아웃</button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto p-4 md:p-8">
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
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
        aria-label="새 맛집 추가"
      >
        <PlusIcon />
      </button>

      {/* 모달 */}
      {isModalOpen && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={handleCloseModal}
          onSave={handleSaveRestaurant}
        />
      )}
    </div>
  );
}