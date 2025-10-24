import React from 'react';
import { format } from 'date-fns'; // 날짜 포맷을 위해 date-fns 라이브러리 사용

// --- 아이콘 SVG 컴포넌트 ---

// 별 아이콘
const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

// (신규) 좋아요 하트 아이콘 (outline)
const HeartOutlineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.06l-7.682-7.378a4.5 4.5 0 010-6.364z" />
  </svg>
);

// (신규) 좋아요 하트 아이콘 (solid)
const HeartSolidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

// (신규) 방문 날짜 달력 아이콘
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

// (신규) 신고 깃발 아이콘
const FlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v5a1 1 0 11-2 0V6z" clipRule="evenodd" />
    </svg>
);


// 가격대 라벨
const PRICE_RANGE_LABELS = {
  '₩': '만원 이하', '₩₩': '1~3만원', '₩₩₩': '3~5만원', '₩₩₩₩': '5만원 이상',
};

/**
 * 맛집 정보를 표시하는 카드 컴포넌트
 * @param {object} restaurant - 표시할 맛집 정보 객체
 * @param {function} onEdit - 수정 버튼 클릭 시 호출될 함수
 * @param {function} onDelete - 삭제 버튼 클릭 시 호출될 함수
 * @param {function} onTagClick - 태그 버튼 클릭 시 호출될 함수
 * @param {boolean} [showActions=true] - 수정/삭제 버튼 표시 여부 (기본값 true)
 * @param {React.ReactNode} [ownerInfo] - 카드 하단에 표시할 추가 정보 (예: 작성자 버튼)
 * @param {function} onToggleLike - '좋아요' 버튼 클릭 시 호출될 함수
 * @param {function} onReport - '신고' 버튼 클릭 시 호출될 함수
 */
function RestaurantCard({
  restaurant,
  onEdit,
  onDelete,
  onTagClick,
  showActions = true, // '내 맛집' 페이지에서는 true, '피드'/'프로필'에서는 false
  ownerInfo, // '피드'/'프로필'에서 작성자 정보 표시용
  onToggleLike,
  onReport
}) {
  if (!restaurant) { return null; }

  const address = restaurant.location?.address || '주소 정보 없음';
  const isLiked = restaurant.isLikedByCurrentUser; // 백엔드에서 전달된 좋아요 여부
  const likeCount = restaurant.likeCount || 0; // 백엔드에서 전달된 좋아요 수

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:-translate-y-1 duration-300 flex flex-col h-full">

      {/* '가고싶은 곳' 배지 (visited가 false일 때만 표시) */}
      {!restaurant.visited && (
        <span className="absolute top-2 right-2 z-10 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
          가고싶은 곳
        </span>
      )}

      {/* 맛집 이미지 */}
      <div className="flex-shrink-0">
          <img src={restaurant.imageUrl} alt={restaurant.name || '맛집 이미지'} className="w-full h-48 object-cover"
               onError={(e) => { e.target.onerror = null; e.target.alt="이미지 로딩 실패"; }} />
      </div>

      {/* 맛집 정보 섹션 */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h2 className="text-lg sm:text-xl font-bold mb-1 text-gray-900 dark:text-white truncate" title={restaurant.name}>
          {restaurant.name || '이름 없음'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 truncate" title={address}>
          {address}
        </p>
        
        {/* 별점 */}
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => ( <StarIcon key={i} className={`h-4 w-4 sm:h-5 sm:w-5 ${i < restaurant.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} /> ))}
          <span className="ml-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">({restaurant.rating || 0})</span>
        </div>

        {/* 가격대 및 방문 날짜 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {restaurant.priceRange && PRICE_RANGE_LABELS[restaurant.priceRange] && (
              <span>가격대: {restaurant.priceRange}</span>
            )}
            {/* 방문 날짜 표시 (방문한 곳일 때만) */}
            {restaurant.visited && restaurant.visitedDate && (
                <span className="flex items-center gap-1">
                    <CalendarIcon />
                    방문: {format(new Date(restaurant.visitedDate), 'yyyy.MM.dd')}
                </span>
            )}
        </div>

        {/* 메모 */}
        <p className="text-gray-700 dark:text-gray-300 text-sm flex-grow mb-4 whitespace-pre-wrap line-clamp-3">
          {restaurant.memo || ''}
        </p>

        {/* 태그 목록 */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {restaurant.tags.map((tag) => (
              <button key={tag} onClick={() => onTagClick(tag)} className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* 작성자 정보 (피드/프로필용) */}
        {ownerInfo && <div className="mb-4">{ownerInfo}</div>}

        {/* --- 카드 하단 액션 버튼 영역 --- */}
        <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700/50">
          {/* 왼쪽: 좋아요, 신고 버튼 */}
          <div className="flex items-center space-x-2">
            {/* 좋아요 버튼 */}
            <button
              onClick={onToggleLike}
              className={`flex items-center space-x-1 p-1.5 rounded-md transition-colors ${
                isLiked
                  ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={isLiked ? '좋아요 취소' : '좋아요'}
              disabled={!onToggleLike} // onToggleLike prop이 없으면 비활성화
            >
              {isLiked ? <HeartSolidIcon /> : <HeartOutlineIcon />}
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            {/* 신고 버튼 */}
            {!showActions && onReport && ( // 내 게시물이 아닐 때만 신고 버튼 표시
                <button
                    onClick={onReport}
                    className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="이 게시물 신고하기"
                >
                    <FlagIcon />
                </button>
            )}
          </div>

          {/* 오른쪽: 수정, 삭제 버튼 (내 맛집일 때만) */}
          {showActions && (
            <div className="flex justify-end space-x-2">
              <button onClick={() => onEdit(restaurant)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
                수정
              </button>
              <button onClick={() => onDelete(restaurant._id)} className="bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500">
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantCard;

