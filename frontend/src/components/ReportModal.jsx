import React, { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * 신고 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 여부
 * @param {function} onClose - 모달 닫기 함수
 * @param {function} onSubmit - 신고 제출 함수 (reason 전달)
 * @param {string} targetType - 'Photo' 또는 'Comment'
 */
function ReportModal({ isOpen, onClose, onSubmit, targetType }) {
  const [reason, setReason] = useState(''); // 신고 사유 입력 상태
  const [loading, setLoading] = useState(false); // 제출 로딩 상태

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('신고 사유를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      // onSubmit은 HomePage/FeedPage의 handleReportSubmit을 호출
      // 성공/실패 토스트는 부모 컴포넌트의 toast.promise가 처리
      await onSubmit(reason);
      // 성공 시 부모가 onClose를 호출하여 모달 닫음
    } catch (error) {
      // 실패 시에도 부모가 토스트 처리
      console.error("신고 제출 중 에러 (모달)", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // 모달이 열려있지 않으면 렌더링 안 함

  const title = targetType === 'Photo' ? '게시물 신고' : '댓글 신고';

  return (
    // 모달 배경 (z-50: 최상단)
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      {/* 모달 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg relative animate-fade-in-up">
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
        {/* 모달 제목 (👇 text-xl sm:text-2xl 로 수정) */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">{title}</h2>

        {/* 신고 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* 👇 break-words 추가 */}
            <label htmlFor="reason" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 break-words">
              신고 사유를 구체적으로 작성해주세요.
            </label>
            <textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 부적절한 광고, 스팸, 욕설 등"
              rows="4"
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              maxLength={500}
              disabled={loading} // 로딩 중 비활성화
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading || !reason.trim()} // 로딩 중이거나 내용 없으면 비활성화
            >
              {loading ? '접수 중...' : '신고 접수'}
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
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default ReportModal;

