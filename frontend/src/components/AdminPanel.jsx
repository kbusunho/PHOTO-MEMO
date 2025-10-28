import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, deleteUser, updateUser } from '../api/users.js';
import { getAdminStats, getReports, updateReportStatus } from '../api/admin.js';
import UserEditModal from './UserEditModal.jsx';
import Pagination from './Pagination';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// (신규) 신고 대상 링크를 생성하는 헬퍼 컴포넌트
const ReportTargetLink = ({ report, onViewProfile }) => {
  const photoOwnerId = report.targetPhotoId?.owner?._id || report.targetPhotoId?.owner;
  const linkBase = `/#/user/${photoOwnerId}`;
  
  if (report.targetType === 'Photo') {
    return (
      <a 
        href={linkBase}
        onClick={(e) => { e.preventDefault(); onViewProfile(photoOwnerId); toast('게시글 소유자 프로필로 이동합니다.'); }} 
        className="text-indigo-400 hover:underline truncate"
        title={report.targetPhotoId?.name || '알 수 없는 게시글'}
      >
        게시글: "{report.targetPhotoId?.name || '삭제되었거나 알 수 없음'}"
      </a>
    );
  }
  
  if (report.targetType === 'Comment') {
    const commentText = report.targetComment?.text || '[삭제되었거나 찾을 수 없는 댓글]';
    return (
      <a 
        href={linkBase}
        onClick={(e) => { e.preventDefault(); onViewProfile(photoOwnerId); toast('게시글 소유자 프로필로 이동합니다.'); }} 
        className="text-indigo-400 hover:underline truncate" 
        title={commentText}
      >
        댓글: "{commentText}"
      </a>
    );
  }
  return <span>알 수 없는 대상</span>;
};


function AdminPanel({ currentUser, onClose, onViewProfile }) {
  // --- 공통 상태 ---
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, todayUsers: 0, totalPhotos: 0, todayDeletedUsers: 0, pendingReports: 0 });
  const [view, setView] = useState('members'); // 'members' 또는 'reports'
  
  // --- 회원 관리 상태 ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false); // 회원목록 로딩
  const [userError, setUserError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 👈 모달 열림/닫힘 상태
  const [editingUser, setEditingUser] = useState(null); // 👈 수정할 사용자 정보

  // --- 신고 관리 상태 ---
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false); // 신고목록 로딩
  const [reportError, setReportError] = useState(null);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('Pending'); // 'Pending', 'Resolved', 'Dismissed'

  // --- 데이터 로딩 ---
  
  // 1. 통계 로드
  const fetchStats = useCallback(async () => {
      setLoadingStats(true);
      try {
        const statsData = await getAdminStats();
        setStats({
            totalUsers: statsData.totalUsers || 0,
            todayUsers: statsData.todayUsers || 0,
            totalPhotos: statsData.totalPhotos || 0,
            todayDeletedUsers: statsData.todayDeletedUsers || 0,
            pendingReports: statsData.pendingReports || 0
        });
      } catch (err) {
        toast.error("통계 로딩 실패");
        console.error("통계 로딩 실패:", err);
      } finally {
        setLoadingStats(false);
      }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 2. 회원 목록 로드
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setUserError(err.response?.data?.message || '사용자 목록 로딩 실패');
      toast.error('사용자 목록을 불러올 수 없습니다.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // 3. 신고 목록 로드
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setReportError(null);
    try {
      const data = await getReports({ status: reportStatusFilter, page: reportPage, limit: 10 });
      setReports(data.reports);
      setReportTotalPages(data.totalPages);
    } catch (err) {
      setReportError(err.response?.data?.message || '신고 목록 로딩 실패');
      toast.error('신고 목록을 불러올 수 없습니다.');
    } finally {
      setLoadingReports(false);
    }
  }, [reportStatusFilter, reportPage]);

  // 4. 탭 변경 시 해당 탭 데이터 로드
  useEffect(() => {
    if (view === 'members') {
      fetchUsers();
    } else if (view === 'reports') {
      fetchReports();
    }
  }, [view, fetchUsers, fetchReports]);

  // --- 회원 관리 핸들러 ---
  
  // 👇👇👇 === 여기가 수정되었습니다! (수정이 안눌리는 버그 수정) === 👇👇👇
  const handleOpenEditModal = (user) => {
    setEditingUser(user); // 1. 수정할 사용자 정보 설정
    setIsEditModalOpen(true); // 2. 모달 열기 상태로 변경
  };
  // 👆👆👆 === 여기까지 수정 === 👆👆👆

  const handleCloseEditModal = () => {
      setEditingUser(null);
      setIsEditModalOpen(false); // 모달 닫기
  };
  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(u => (u._id === updatedUser._id ? updatedUser : u)));
    if (updatedUser._id === currentUser.id) {
      toast('본인 정보가 수정되었습니다. 일부 변경사항은 다음 로그인 시 반영됩니다.', { icon: 'ℹ️' });
    }
  };
  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete._id === currentUser.id) {
      toast.error("자기 자신은 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm(`정말 '${userToDelete.email}' 사용자를 삭제하시겠습니까?\n이 사용자의 모든 맛집 기록도 함께 삭제됩니다.`)) {
      try {
        await deleteUser(userToDelete._id);
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
        toast.success("사용자가 삭제되었습니다.");
      } catch (err) {
        toast.error(`삭제 실패: ${err.response?.data?.message || '서버 오류'}`);
      }
    }
  };
  const handleToggleActive = async (userToToggle) => {
    if (userToToggle._id === currentUser.id && userToToggle.role === 'admin' && userToToggle.isActive) {
       const activeAdminCount = users.filter(u => u.role === 'admin' && u.isActive).length;
       if (activeAdminCount <= 1) {
         toast.error('유일한 활성 관리자는 비활성화할 수 없습니다.');
         return;
       }
    }
    const newState = !userToToggle.isActive;
    const actionText = newState ? '활성화' : '비활성화';
    if (window.confirm(`'${userToToggle.email}' 사용자를 ${actionText}하시겠습니까?`)) {
      try {
        const updatedUser = await updateUser(userToToggle._id, { isActive: newState });
        handleUserUpdated(updatedUser);
        toast.success(`사용자가 ${actionText}되었습니다.`);
      } catch (err) {
        toast.error(`${actionText} 실패: ${err.response?.data?.message || '서버 오류'}`);
      }
    }
  };
  
  // --- 신고 관리 핸들러 ---
  const handleReportFilterChange = (status) => {
    setReportStatusFilter(status);
    setReportPage(1);
  };
  const handleReportPageChange = (page) => {
    setReportPage(page);
  };
  
  const handleReportAction = async (report, newStatus) => {
    const actionText = newStatus === 'Resolved' ? '처리' : '기각';
    if (!window.confirm(`이 신고를 '${actionText}' 상태로 변경하시겠습니까?`)) {
        return;
    }
    
    try {
        await updateReportStatus(report._id, newStatus);
        setReports(prev => prev.filter(r => r._id !== report._id));
        if (report.status === 'Pending') {
             setStats(prev => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }));
        }
        toast.success(`신고가 ${actionText} 처리되었습니다.`);
        
        if (newStatus === 'Resolved') {
            toast.success('신고가 처리되었습니다. (콘텐츠 자동 삭제 로직은 구현 필요)');
        }
    } catch (err) {
         toast.error(err.response?.data?.message || '신고 처리 실패');
    }
  };


  // --- JSX 렌더링 ---
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-30 p-4">
        {/* 모바일 화면에서는 p-4, sm 이상에서는 p-6 sm:p-8 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-8 w-full max-w-7xl relative animate-fade-in-up max-h-[90vh] flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">관리자 패널</h2>

          {/* 통계 대시보드 (모바일 반응형 수정) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">총 회원</div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.totalUsers}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">오늘 가입</div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.todayUsers}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">오늘 탈퇴</div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : (stats.todayDeletedUsers || 0)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg text-center">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">총 맛집</div>
              <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{loadingStats ? '...' : stats.totalPhotos}</div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 p-3 sm:p-4 rounded-lg text-center col-span-2 sm:col-span-1">
              <div className="text-xs sm:text-sm text-red-600 dark:text-red-300">대기중 신고</div>
              <div className="text-lg md:text-2xl font-bold text-red-700 dark:text-red-200">{loadingStats ? '...' : stats.pendingReports}</div>
            </div>
          </div>
          
          {/* 탭 버튼 */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-6">
                  <button
                      onClick={() => setView('members')}
                      className={`py-3 px-1 text-sm font-medium transition-colors
                          ${view === 'members'
                              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none'}`
                      }
                  >
                      회원 관리
                  </button>
                  <button
                      onClick={() => setView('reports')}
                      className={`relative py-3 px-1 text-sm font-medium transition-colors
                          ${view === 'reports'
                              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none'}`
                      }
                  >
                      신고 관리
                      {!loadingStats && stats.pendingReports > 0 && (
                          <span className="absolute top-2 -right-5 ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
                              {stats.pendingReports}
                          </span>
                      )}
                  </button>
              </nav>
          </div>

          {/* 탭 컨텐츠 (스크롤 영역) */}
          <div className="overflow-y-auto flex-grow -mx-4 sm:-mx-8 px-4 sm:px-8">
            
            {/* 회원 관리 탭 */}
            {view === 'members' && (
              <>
                {loadingUsers && <p className="text-gray-500 dark:text-gray-400 text-center py-4">회원 목록 로딩 중...</p>}
                {userError && <p className="text-red-500 text-center py-4">{userError}</p>}
                {!loadingUsers && !userError && (
                  <div className="align-middle inline-block min-w-full shadow overflow-x-auto sm:rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이메일</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">닉네임</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">전화번호</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">권한</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">가입일</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => onViewProfile(user._id)} className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none truncate max-w-[150px] sm:max-w-none" title={`${user.email} 공개 프로필 보기`}>
                                {user.email}
                              </button>
                            </td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.displayName || 'N/A'}</td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{user.phoneNumber || '-'}</td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm">
                              {user.role === 'admin' ? ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">Admin</span> ) : ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">User</span> )}
                            </td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm">
                              {user.isActive ? ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">활성</span> ) : ( <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100">비활성</span> )}
                            </td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm space-y-1 sm:space-y-0 sm:space-x-2">
                              <button onClick={() => handleToggleActive(user)} disabled={user._id === currentUser.id && user.role === 'admin' && users.filter(u=>u.role==='admin' && u.isActive).length <= 1 && user.isActive} className={`w-full sm:w-auto text-xs font-bold py-1 px-3 rounded-md transition-colors ${ user.isActive ? 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800' : 'bg-green-600 hover:bg-green-700' } text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ...`} title={user.isActive ? '계정 비활성화' : '계정 활성화'}>
                                {user.isActive ? '비활성' : '활성'}
                              </button>
                              <button onClick={() => handleOpenEditModal(user)} className="w-full sm:w-auto bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-xs font-bold py-1 px-3 rounded-md transition-colors focus:outline-none ..." title="사용자 정보 수정">
                                수정
                              </button>
                              <button onClick={() => handleDeleteUser(user)} className="w-full sm:w-auto bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ..." disabled={user._id === currentUser.id} title="사용자 삭제">
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* 신고 관리 탭 */}
            {view === 'reports' && (
              <div>
                <div className="flex space-x-2 mb-4">
                  <button onClick={() => handleReportFilterChange('Pending')} className={`text-xs font-medium py-1 px-3 rounded-full transition-colors ${reportStatusFilter === 'Pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 ...'}`}>대기중 ({stats.pendingReports})</button>
                  <button onClick={() => handleReportFilterChange('Resolved')} className={`text-xs font-medium py-1 px-3 rounded-full transition-colors ${reportStatusFilter === 'Resolved' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 ...'}`}>처리됨</button>
                  <button onClick={() => handleReportFilterChange('Dismissed')} className={`text-xs font-medium py-1 px-3 rounded-full transition-colors ${reportStatusFilter === 'Dismissed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 ...'}`}>기각됨</button>
                </div>
                
                {loadingReports && <p className="text-center ...">신고 목록 로딩 중...</p>}
                {reportError && <p className="text-center ...">{reportError}</p>}
                {!loadingReports && !reportError && reports.length === 0 && (
                    <p className="text-center ...">해당 상태의 신고 내역이 없습니다.</p>
                )}
                {!loadingReports && !reportError && reports.length > 0 && (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row sm:items-start sm:justify-between border border-gray-200 dark:border-gray-600">
                                <div className="flex-grow mb-3 sm:mb-0 sm:pr-4 overflow-hidden">
                                    <p className="text-sm ..."><strong>신고자:</strong> {report.reporter?.displayName || '...'} ...</p>
                                    <p className="font-semibold ..."><strong>사유:</strong> {report.reason}</p>
                                    <p className="text-sm ..."><strong>대상:</strong> <ReportTargetLink report={report} onViewProfile={onViewProfile} /></p>
                                </div>
                                {report.status === 'Pending' && (
                                    <div className="flex-shrink-0 flex flex-row sm:flex-col gap-2"> {/* 👇 flex-row sm:flex-col (모바일에선 가로) */}
                                        <button onClick={() => handleReportAction(report, 'Resolved')} className="text-xs flex-1 sm:flex-none ...">처리 완료</button>
                                        <button onClick={() => handleReportAction(report, 'Dismissed')} className="text-xs flex-1 sm:flex-none ...">기각</button>
                                    </div>
                                )}
                                {report.status !== 'Pending' && (
                                    <div className="flex-shrink-0 text-sm ...">
                                        <p className={`... ${report.status === 'Resolved' ? '...' : '...'}`}>{report.status === 'Resolved' ? '처리 완료됨' : '기각됨'}</p>
                                        <p className="text-xs ...">by {report.resolvedBy?.displayName || '관리자'}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {!loadingReports && reportTotalPages > 1 && (
                    <Pagination currentPage={reportPage} totalPages={reportTotalPages} onPageChange={handleReportPageChange} />
                )}
              </div>
            )}
          </div>
          
          <style>{`
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            .overflow-y-auto::-webkit-scrollbar { width: 6px; }
            .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
            .overflow-y-auto::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
            .dark .overflow-y-auto::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.5); }
          `}</style>
        </div>
      </div>
      
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

