import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../api/users.js';
import { getAdminStats } from '../api/admin.js'; // 1. Stats API 임포트
import UserEditModal from './UserEditModal.jsx'; // 2. Edit Modal 임포트

function AdminPanel({ currentUser, onClose }) { 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 3. Stats 상태 추가
  const [stats, setStats] = useState({ totalUsers: 0, todayUsers: 0, totalPhotos: 0 });
  
  // 4. Edit Modal 상태 추가
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // 두 API를 동시에 호출
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getAdminStats()
        ]);
        setUsers(usersData);
        setStats(statsData);
      } catch (err) {
        setError(err.response?.data?.message || '데이터를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // 5. Edit Modal 핸들러
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };
  
  // 6. User가 업데이트 되었을 때 실행될 콜백
  const handleUserUpdated = (updatedUser) => {
    // users state 배열에서 수정된 user 정보만 교체
    setUsers(users.map(u => (u._id === updatedUser._id ? updatedUser : u)));
    // 만약 수정한 유저가 현재 로그인한 유저 본인이라면, AuthContext의 user도 업데이트해야 하지만
    // 여기서는 일단 목록만 업데이트합니다. (페이지 새로고침 시 자동 반영됨)
  };

  const handleDeleteUser = async (userToDelete) => {
    // 본인 계정인지 확인
    if (userToDelete._id === currentUser.id) {
      alert("자기 자신은 삭제할 수 없습니다.");
      return;
    }
    
    if (window.confirm(`정말 '${userToDelete.email}' 사용자를 삭제하시겠습니까?\n이 사용자의 모든 맛집 기록도 함께 삭제됩니다.`)) {
      try {
        await deleteUser(userToDelete._id);
        setUsers(users.filter(u => u._id !== userToDelete._id));
        // 7. Stats도 수동 업데이트 (삭제 시)
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 })); 
        alert("사용자가 삭제되었습니다.");
      } catch (err) {
        alert(`삭제 실패: ${err.response?.data?.message || '서버 오류'}`);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30 p-4">
        {/* max-w-5xl로 너비 늘림, max-h-[90vh]로 높이 제한 */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-5xl relative animate-fade-in-up max-h-[90vh] flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
          <h2 className="text-2xl font-bold mb-6 text-white">회원 관리 (관리자)</h2>
          
          {/* 8. Stats 대시보드 UI 추가 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400">총 회원 수</div>
              <div className="text-3xl font-bold text-white">{loading ? '...' : stats.totalUsers}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400">오늘 가입</div>
              <div className="text-3xl font-bold text-white">{loading ? '...' : stats.todayUsers}</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400">총 맛집 기록</div>
              <div className="text-3xl font-bold text-white">{loading ? '...' : stats.totalPhotos}</div>
            </div>
          </div>
          
          {loading && <p className="text-gray-400 text-center">사용자 목록을 불러오는 중...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          
          {!loading && !error && (
            // 테이블 영역만 스크롤되도록
            <div className="overflow-y-auto"> 
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">닉네임</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">가입일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.displayName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.role === 'admin' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-800 text-red-100">Admin</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {/* 9. "수정" 버튼 추가 */}
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-800 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={user._id === currentUser.id}
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
      
      {/* 10. Edit Modal 렌더링 */}
      {isEditModalOpen && editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={handleCloseEditModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}

export default AdminPanel;