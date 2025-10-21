import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  // 페이지 번호 목록을 만듭니다. (예: 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // 중앙에 표시할 최대 페이지 수
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    // 페이지 번호가 maxPagesToShow보다 적게 계산될 경우 보정
    if (currentPage - half < 1) {
      end = Math.min(totalPages, maxPagesToShow);
    }
    if (currentPage + half > totalPages) {
      start = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    // 1페이지와 ... 추가
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // 중간 페이지 번호들
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 마지막 페이지와 ... 추가
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) {
    return null; // 페이지가 1개 이하면 아무것도 표시 안 함
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
      >
        이전
      </button>

      {/* 페이지 번호 버튼들 */}
      {pageNumbers.map((page, index) =>
        page === '...' ? (
          <span key={index} className="px-4 py-2 text-gray-400">...</span>
        ) : (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentPage === page
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
      >
        다음
      </button>
    </nav>
  );
}

export default Pagination;