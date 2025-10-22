import React, { useState, useEffect } from 'react';
import { getPublicRestaurants } from '../api/photos'; // 공개 맛집 API
import RestaurantCard from '../components/RestaurantCard'; // 맛집 카드 (재사용)
import { useAuth } from '../context/AuthContext'; // 내 정보 확인용 (내 프로필인지 구분)
import toast from 'react-hot-toast'; // 알림
import Footer from '../components/Footer'; // 푸터 추가

/**
 * 특정 사용자의 공개 프로필 페이지 컴포넌트
 * @param {string} userId - 보여줄 프로필의 사용자 ID
 * @param {function} onViewChange - 뷰 모드 변경 함수 (예: 홈으로 돌아가기)
 */
function ProfilePage({ userId, onViewChange }) {
  const { user: currentUser } = useAuth(); // 현재 로그인한 사용자 정보
  const [profileUser, setProfileUser] = useState(null); // 프로필 페이지의 사용자 정보
  const [publicRestaurants, setPublicRestaurants] = useState([]); // 해당 사용자의 공개 맛집 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  // userId가 변경될 때마다 프로필 데이터 로드
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 백엔드 API 호출하여 공개 맛집 목록과 사용자 정보 가져오기
        const data = await getPublicRestaurants(userId);
        setProfileUser(data.user); // 프로필 사용자 정보 설정
        setPublicRestaurants(data.photos); // 공개 맛집 목록 설정
      } catch (err) {
        setError(err.response?.data?.message || '프로필 정보를 불러오는 중 오류가 발생했습니다.');
        toast.error('프로필 로딩에 실패했습니다.');
        // 필요시 홈으로 리다이렉트
        // onViewChange('home');
      } finally {
        setLoading(false);
      }
    };

    // userId가 유효할 때만 API 호출
    if (userId) {
      fetchProfileData();
    } else {
      // userId가 없는 경우 (잘못된 접근 등)
      setError('잘못된 접근입니다.');
      setLoading(false);
    }
  }, [userId]); // userId가 바뀔 때마다 useEffect 재실행

  // 프로필 페이지에서는 편집/삭제/태그 클릭 기능이 작동하지 않도록 빈 함수 전달
  const dummyHandler = () => {
    toast('다른 사용자의 기록은 수정/삭제할 수 없습니다.', { icon: 'ℹ️' });
  };
  const dummyTagHandler = () => {
      toast('다른 사용자의 프로필에서는 태그 필터링을 사용할 수 없습니다.', { icon: 'ℹ️' });
  }

  // 현재 보고 있는 프로필이 내 프로필인지 확인
  const isMyProfile = currentUser?.id === userId;

  return (
    // 전체 레이아웃 (flex-col, min-h-screen)
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      {/* 페이지 헤더 */}
       <div className="container mx-auto px-4 md:px-8 pt-6 sm:pt-8">
            {/* 홈으로 돌아가기 버튼 */}
            <button
                onClick={() => onViewChange('home')} // 클릭 시 App.jsx의 핸들러 호출하여 뷰 변경
                className="mb-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
            >
                &larr; 내 맛집 목록으로 돌아가기
            </button>
            {/* 로딩 및 에러 메시지 */}
            {loading && <p className="text-center text-gray-500 dark:text-gray-400 py-10">프로필 정보를 불러오는 중...</p>}
            {error && <p className="text-center text-red-500 py-10">{error}</p>}
            {/* 프로필 사용자 정보 표시 */}
            {!loading && !error && profileUser && (
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                        {profileUser.displayName || profileUser.email} 님의 맛집로그
                        {isMyProfile && " (내 프로필)"} {/* 내 프로필일 경우 표시 */}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isMyProfile ? "내가 공개로 설정한 맛집 기록입니다." : "이 사용자가 공개로 설정한 맛집 기록입니다."}
                    </p>
                </div>
            )}
       </div>

      {/* 메인 콘텐츠 영역 (flex-grow로 푸터 밀어내기) */}
      <main className="container mx-auto p-4 md:px-8 flex-grow">
        {/* 공개 맛집 목록 */}
        {!loading && !error && profileUser && (
          publicRestaurants.length === 0 ? (
            // 공개된 맛집이 없을 때 메시지
            <div className="text-center text-gray-500 dark:text-gray-500 py-10">
                <p className="text-lg">아직 공개된 맛집 기록이 없습니다.</p>
                {isMyProfile && <p>홈에서 맛집을 추가하거나 기존 기록을 '공개'로 수정해보세요!</p>}
            </div>
          ) : (
            // 공개 맛집 카드 목록
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {publicRestaurants.map((r) => (
                <RestaurantCard
                  key={r._id}
                  restaurant={r}
                  // 공개 프로필에서는 수정/삭제/태그 클릭 기능 비활성화
                  onEdit={dummyHandler}
                  onDelete={dummyHandler}
                  onTagClick={dummyTagHandler}
                />
                ))}
            </div>
          )
        )}
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

export default ProfilePage;

