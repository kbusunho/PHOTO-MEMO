import React, { useState } from 'react';
// editComment API 함수 임포트
import { addComment, deleteComment, editComment } from '../api/photos';
import { useAuth } from '../context/AuthContext'; // 현재 사용자 정보 확인
import toast from 'react-hot-toast'; // 알림 라이브러리

// (신규) 신고 깃발 아이콘
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v5a1 1 0 11-2 0V6z" clipRule="evenodd" />
    </svg>
);


/**
 * 댓글 섹션 컴포넌트
 * @param {string} photoId - 현재 맛집 기록의 ID
 * @param {Array} initialComments - 초기 댓글 목록 (Photo 객체에 포함된 comments 배열)
 * @param {function} [onCommentAdded] - 댓글 추가 성공 시 호출될 콜백 (옵션)
 * @param {function} [onCommentDeleted] - 댓글 삭제 성공 시 호출될 콜백 (옵션)
 * @param {function} [onCommentUpdated] - 댓글 수정 성공 시 호출될 콜백 (옵션)
 * @param {function} [onReportComment] - 댓글 신고 버튼 클릭 시 호출될 콜백 (옵션)
 */
function CommentSection({ photoId, initialComments = [], onCommentAdded, onCommentDeleted, onCommentUpdated, onReportComment }) {
  const { user: currentUser } = useAuth(); // 현재 로그인한 사용자 정보
  const [comments, setComments] = useState(initialComments || []); // 댓글 목록 상태 (null 방지)
  const [newComment, setNewComment] = useState(''); // 새 댓글 입력 상태
  // --- 수정 관련 상태 ---
  const [editingCommentId, setEditingCommentId] = useState(null); // 수정 중인 댓글 ID (null이면 수정X)
  const [editText, setEditText] = useState(''); // 수정 중인 댓글 텍스트
  // --- 로딩 상태 ---
  const [isSubmitting, setIsSubmitting] = useState(false); // 댓글 등록 로딩
  const [isUpdating, setIsUpdating] = useState(false); // 댓글 수정 로딩

  // 새 댓글 입력 변경 핸들러
  const handleInputChange = (e) => {
    setNewComment(e.target.value);
  };

  // 댓글 제출 핸들러
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const addedComment = await addComment(photoId, newComment.trim());
      // API 응답에 owner 정보가 포함되어 옴 (백엔드 수정됨)
      setComments(prevComments => [addedComment, ...prevComments]);
      setNewComment('');
      toast.success('댓글이 등록되었습니다.');
      if (onCommentAdded) onCommentAdded(addedComment); // 부모 컴포넌트에 알림
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      toast.error(error.response?.data?.message || '댓글 등록 중 오류 발생');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    if (window.confirm("정말 이 댓글을 삭제하시겠습니까?")) {
      try {
        await deleteComment(photoId, commentId);
        setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
        toast.success('댓글이 삭제되었습니다.');
        if (onCommentDeleted) onCommentDeleted(commentId); // 부모 컴포넌트에 알림
      } catch (error) {
        console.error("댓글 삭제 실패:", error);
        toast.error(error.response?.data?.message || '댓글 삭제 중 오류 발생');
      }
    }
  };

  // 댓글 수정 시작 핸들러
  const handleEditClick = (comment) => {
      setEditingCommentId(comment._id); // 수정 모드 진입
      setEditText(comment.text); // 현재 댓글 내용으로 초기화
  };

  // 댓글 수정 취소 핸들러
  const handleCancelEdit = () => {
      setEditingCommentId(null); // 수정 모드 종료
      setEditText('');
  };

  // 댓글 수정 저장 핸들러
  const handleUpdateComment = async (commentId) => {
      if (!editText.trim() || !currentUser || isUpdating) return;
      setIsUpdating(true);

      try {
          // 댓글 수정 API 호출
          const updatedComment = await editComment(photoId, commentId, editText.trim());
          // 상태 업데이트 (목록에서 수정된 댓글 교체)
          setComments(prevComments => prevComments.map(comment =>
              comment._id === commentId ? updatedComment : comment
          ));
          handleCancelEdit(); // 수정 상태 종료
          toast.success('댓글이 수정되었습니다.');
          if (onCommentUpdated) onCommentUpdated(updatedComment); // 부모 컴포넌트에 알림
      } catch (error) {
          console.error("댓글 수정 실패:", error);
          toast.error(error.response?.data?.message || '댓글 수정 중 오류 발생');
      } finally {
          setIsUpdating(false);
      }
  };

  // 시간 포맷 함수 (간단 버전)
  const formatTimeAgo = (dateString) => {
      if (!dateString) return ''; // 날짜 없으면 빈 문자열
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 5) return '방금 전';
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}년 전`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}달 전`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}일 전`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}시간 전`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}분 전`;
      return `${Math.floor(seconds)}초 전`;
  };


  return (
    // 댓글 섹션 컨테이너
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">댓글 ({comments.length})</h3>

      {/* 댓글 입력 폼 (로그인 시에만 보임) */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mb-4 flex items-start space-x-2">
          <textarea
            value={newComment}
            onChange={handleInputChange}
            placeholder="댓글을 남겨보세요..."
            rows="2"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors duration-200"
            required
            disabled={isSubmitting} // 등록 중 비활성화
          />
          <button
            type="submit"
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !newComment.trim()} // 로딩 중 또는 내용 없을 때 비활성화
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </form>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4"> {/* 댓글 간 간격 증가 */}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex items-start space-x-3 text-sm pb-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* 작성자 정보 (더 넓게) */}
              <div className="flex-shrink-0 font-semibold text-gray-700 dark:text-gray-300 w-24 truncate pt-0.5" title={comment.owner?.displayName || comment.owner?.email || '알 수 없음'}>
                 {comment.owner?.displayName || comment.owner?.email || '익명'}
              </div>
              {/* 댓글 내용 또는 수정 폼 */}
              <div className="flex-grow text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {editingCommentId === comment._id ? (
                  // --- 수정 모드 UI ---
                  <div className="flex flex-col space-y-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="2"
                      className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors duration-200"
                      disabled={isUpdating} // 수정 중 비활성화
                    />
                    <div className="flex items-center space-x-2 self-end">
                       <button
                          onClick={() => handleUpdateComment(comment._id)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isUpdating || !editText.trim()} // 로딩 중 또는 내용 없을 때 비활성화
                        >
                          {isUpdating ? '저장 중...' : '저장'}
                        </button>
                       <button
                          onClick={handleCancelEdit}
                          className="text-xs text-gray-500 hover:underline disabled:opacity-50"
                          disabled={isUpdating} // 로딩 중 비활성화
                        >
                          취소
                        </button>
                    </div>
                  </div>
                ) : (
                  // --- 일반 댓글 표시 ---
                  comment.text
                )}
              </div>
              {/* 시간 및 관리 버튼 */}
              <div className="flex-shrink-0 flex items-center space-x-2 text-gray-400 dark:text-gray-500 text-xs pt-0.5">
                 <span>{formatTimeAgo(comment.createdAt)}</span>
                
                {/* 본인 댓글일 때: 수정/삭제 (수정 중 아닐 때) */}
                {currentUser && comment.owner?._id === currentUser._id && editingCommentId !== comment._id && (
                    <>
                       <button onClick={() => handleEditClick(comment)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="댓글 수정">수정</button>
                       <button onClick={() => handleDeleteComment(comment._id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors" title="댓글 삭제">삭제</button>
                    </>
                )}
                
                {/* 다른 사람 댓글일 때: 신고 (onReportComment prop이 있을 때만) */}
                {currentUser && comment.owner?._id !== currentUser._id && onReportComment && (
                    <button
                        onClick={() => onReportComment(comment._id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="댓글 신고하기"
                    >
                        <FlagIcon />
                    </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentSection;

