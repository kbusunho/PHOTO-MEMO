import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../api/users.js'; // 사용자 API
import { getAdminStats } from '../api/admin.js'; // 통계 API
import UserEditModal from './UserEditModal.jsx'; // 수정 모달
import toast from 'react-hot-toast'; // 알림 라이브러리

function AdminPanel({ currentUser, onClose }) {
  const [users, setUsers] = useState([]); // 회원 목록 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  // 👇 stats 상태 기본값에 todayDeletedUsers 추가
  const [stats, setStats] = useState({ totalUsers: 0, todayUsers: 0, totalPhotos: 0, todayDeletedUsers: 0 }); // 통계 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 수정 모달 열림 상태
  const [editingUser, setEditingUser] = useState(null); // 수정할 사용자 정보

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // 사용자 목록과 통계 정보를 동시에 요청
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getAdminStats() // 이 API 응답에 todayDeletedUsers가 포함될 것으로 기대
        ]);
        setUsers(usersData);
        // 👇 백엔드에서 받은 statsData를 그대로 상태에 저장
        setStats(statsData);
        setError(null); // 에러 초기화
      } catch (err) {
        setError(err.response?.data?.message || '데이터를 불러오는 중 오류가 발생했습니다.');
        toast.error('데이터 로드 실패'); // 실패 시 알림
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []); // 마운트 시 한 번만 실행

  // 수정 모달 열기 핸들러
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // 수정 모달 닫기 핸들러
  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  // 사용자 정보가 성공적으로 수정되었을 때 호출되는 콜백
  const handleUserUpdated = (updatedUser) => {
    // 현재 목록(users 상태)에서 해당 사용자 정보만 업데이트
    setUsers(users.map(u => (u._id === updatedUser._id ? updatedUser : u)));
    // (선택 사항) 만약 수정한 유저가 현재 로그인한 유저 본인이라면
    if (updatedUser._id === currentUser.id) {
      toast('본인 정보가 수정되었습니다. 변경사항은 다음 로그인 시 반영됩니다.', { icon: 'ℹ️' });
    }
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = async (userToDelete) => {
    // 본인 계정 삭제 방지
    if (userToDelete._id === currentUser.id) {
      toast.error("자기 자신은 삭제할 수 없습니다.");
      return;
    }

    // 삭제 확인 창
    if (window.confirm(`정말 '${userToDelete.email}' 사용자를 삭제하시겠습니까?\n이 사용자의 모든 맛집 기록도 함께 삭제됩니다.`)) {
      try {
        await deleteUser(userToDelete._id); // 삭제 API 호출
        // 상태 업데이트 (화면에서 즉시 제거)
        setUsers(users.filter(u => u._id !== userToDelete._id));
        // 통계 업데이트 (totalUsers만 감소, todayDeleted는 백엔드 구현 필요)
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        toast.success("사용자가 삭제되었습니다.");
      } catch (err) {
        toast.error(`삭제 실패: ${err.response?.data?.message || '서버 오류'}`);
      }
    }
  };

  return (
    <>
      {/* 모달 배경 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-30 p-4">
        {/* 모달 컨텐츠 */}
        {/* max-w-7xl로 너비 증가, 패딩 조정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-7xl relative animate-fade-in-up max-h-[90vh] flex flex-col">
          {/* 닫기 버튼 */}
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
          {/* 모달 제목 */}
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">회원 관리 (관리자)</h2>

          {/* 👇 통계 대시보드 (grid-cols-4로 변경) 👇 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">총 회원 수</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.totalUsers}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">오늘 가입</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.todayUsers}</div>
            </div>
            {/* '오늘 탈퇴' 항목 추가 */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">오늘 탈퇴</div>
              {/* 백엔드 API 응답의 todayDeletedUsers를 사용, 없으면 0 */}
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : (stats.todayDeletedUsers || 0)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">총 맛집 기록</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.totalPhotos}</div>
            </div>
          </div>

          {/* 로딩 및 에러 메시지 표시 */}
          {loading && <p className="text-gray-500 dark:text-gray-400 text-center py-4">사용자 목록을 불러오는 중...</p>}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}

          {/* 회원 목록 테이블 (로딩 아니고 에러 없을 때만 표시) */}
          {!loading && !error && (
            <div className="overflow-y-auto flex-grow"> {/* 테이블 영역만 스크롤 */}
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                {/* 테이블 헤더 */}
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이메일</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">닉네임</th>
                    {/* 전화번호 헤더 추가 */}
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">전화번호</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">권한</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">가입일</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                {/* 테이블 본문 */}
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.displayName || 'N/A'}</td>
                      {/* 전화번호 데이터 표시 */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.phoneNumber || '-'}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        {user.role === 'admin' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">Admin</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">User</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      {/* 관리 버튼 (수정, 삭제) */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={user._id === currentUser.id} // 본인 삭제 버튼 비활성화
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* 페이드인 애니메이션 스타일 */}
          <style>{`
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
              animation: fade-in-up 0.3s ease-out forwards;
            }
          `}</style>
        </div>
      </div>

      {/* 수정 모달 (isEditModalOpen이 true일 때만 렌더링) */}
      {isEditModalOpen && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={handleCloseEditModal}
          onUserUpdated={handleUserUpdated} // 수정 성공 시 콜백 전달
        />
      )}
    </>
  );
}

export default AdminPanel;

