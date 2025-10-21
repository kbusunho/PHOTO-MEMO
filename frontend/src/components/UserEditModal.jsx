import React, { useState } from 'react';
import { updateUser } from '../api/users';

function UserEditModal({ user, onClose, onUserUpdated }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedData = { displayName, role };
      // API 호출
      const updatedUser = await updateUser(user._id, updatedData);
      
      // 성공 시 AdminPanel의 목록 상태 업데이트
      onUserUpdated(updatedUser); 
      onClose(); // 모달 닫기
    } catch (err) {
      setError(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // z-40: AdminPanel(z-30)보다 위에 뜸
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-white">회원 정보 수정</h2>
        <p className="text-sm text-gray-400 mb-4">Email: {user.email}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임"
              className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">권한</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
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
  );
}

export default UserEditModal;