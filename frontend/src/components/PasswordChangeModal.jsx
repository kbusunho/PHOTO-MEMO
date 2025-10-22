import React, { useState } from 'react';
import { changePassword } from '../api/auth'; // API 함수 임포트
import toast from 'react-hot-toast'; // 알림 라이브러리

function PasswordChangeModal({ onClose }) {
  // 폼 상태 관리
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // 로딩 상태

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 새 비밀번호 확인
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    // (선택 사항) 새 비밀번호 길이 검증
    if (newPassword.length < 6) {
      toast.error('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true); // 로딩 시작

    try {
      // 비밀번호 변경 API 호출
      await changePassword({ currentPassword, newPassword });
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      onClose(); // 성공 시 모달 닫기
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      toast.error(error.response?.data?.message || "비밀번호 변경 중 오류 발생");
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  return (
    // 모달 배경 (z-40: 다른 모달보다 위에 표시)
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-40 p-4">
      {/* 모달 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md relative animate-fade-in-up">
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
        {/* 모달 제목 */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">비밀번호 변경</h2>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoComplete="current-password"
            />
          </div>
          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6} // 최소 길이
              autoComplete="new-password"
            />
          </div>
          {/* 새 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-3 border ${newPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {newPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">새 비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword} // 입력값 유효성 검사 추가
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>
      {/* 애니메이션 스타일 (기존과 동일) */}
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

export default PasswordChangeModal;
