import React, { useState } from 'react';
import { updateUser } from '../api/users'; // 사용자 수정 API
import toast from 'react-hot-toast'; // 알림 라이브러리

/**
 * 사용자 정보 수정 모달 컴포넌트 (관리자용)
 * @param {object} user - 수정할 사용자 정보 객체
 * @param {function} onClose - 모달 닫기 함수
 * @param {function} onUserUpdated - 사용자 정보 수정 성공 시 호출될 콜백
 */
function UserEditModal({ user, onClose, onUserUpdated }) {
  // 폼 상태 관리
  const [displayName, setDisplayName] = useState(user.displayName || ''); // 닉네임
  const [role, setRole] = useState(user.role); // 권한 (user/admin)
  const [isActive, setIsActive] = useState(user.isActive); // 활성 상태 (true/false)
  const [loading, setLoading] = useState(false); // 저장 로딩 상태

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 동작 방지
    setLoading(true); // 로딩 시작

    try {
      // 수정할 데이터 객체 생성
      const updatedData = { displayName, role, isActive };
      // 사용자 정보 수정 API 호출
      const updatedUser = await updateUser(user._id, updatedData);

      toast.success('사용자 정보가 성공적으로 수정되었습니다.'); // 성공 알림
      onUserUpdated(updatedUser); // 부모 컴포넌트(AdminPanel)에 수정된 정보 전달
      onClose(); // 모달 닫기
    } catch (err) {
      // 실패 알림 (백엔드 에러 메시지 또는 기본 메시지)
      toast.error(err.response?.data?.message || '사용자 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  return (
    // 모달 배경 (어둡게)
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-40 p-4">
      {/* 모달 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md relative animate-fade-in-up">
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
        {/* 모달 제목 */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">회원 정보 수정</h2>
        {/* 사용자 이메일 표시 (수정 불가) */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Email: {user.email}</p>

        {/* 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 닉네임 입력 */}
          <div>
            <label htmlFor="displayNameEdit" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">닉네임</label>
            <input
              id="displayNameEdit"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임"
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 권한 선택 */}
          <div>
            <label htmlFor="roleEdit" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">권한</label>
            <select
              id="roleEdit"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* 계정 상태 선택 (활성/비활성) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">계정 상태</label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" name="isActiveEdit" value="true" checked={isActive === true} onChange={() => setIsActive(true)} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">활성</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" name="isActiveEdit" value="false" checked={isActive === false} onChange={() => setIsActive(false)} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">비활성</span>
              </label>
            </div>
          </div>

          {/* 저장 버튼 영역 */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading} // 로딩 중 비활성화
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default UserEditModal;

