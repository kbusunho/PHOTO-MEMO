import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../api/users.js'; // 방금 만든 API 함수

function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        // 403 (Forbidden) 에러 등
        setError(err.response?.data?.message || '사용자 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    // z-30 : 맛집 추가 모달(z-20)보다 위에 보이도록 설정
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-3xl relative animate-fade-in-up max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-white">회원 관리 (관리자)</h2>
        
        {loading && <p className="text-gray-400">사용자 목록을 불러오는 중...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이메일</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">닉네임</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">권한</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">가입일</th>
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
  );
}

export default AdminPanel;