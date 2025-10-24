import React from 'react';

// 별 아이콘 SVG 컴포넌트
const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

// 가격대 라벨
const PRICE_RANGE_LABELS = {
  '₩': '만원 이하',
  '₩₩': '1~3만원',
  '₩₩₩': '3~5만원',
  '₩₩₩₩': '5만원 이상',
};

/**
 * 맛집 정보를 표시하는 카드 컴포넌트
 * @param {object} restaurant - 표시할 맛집 정보 객체
 * @param {function} onEdit - 수정 버튼 클릭 시 호출될 함수
 * @param {function} onDelete - 삭제 버튼 클릭 시 호출될 함수
 * @param {function} onTagClick - 태그 버튼 클릭 시 호출될 함수
 * @param {boolean} [showActions=true] - 수정/삭제 버튼 표시 여부 (기본값 true)
 * @param {React.ReactNode} [ownerInfo] - 카드 하단에 표시할 추가 정보 (예: 작성자 버튼)
 */
function RestaurantCard({ restaurant, onEdit, onDelete, onTagClick, showActions = true, ownerInfo }) {
  // restaurant 객체가 없을 경우 렌더링하지 않음 (오류 방지)
  if (!restaurant) {
    return null;
  }
  // location 객체 및 address 확인 (오류 방지)
  const address = restaurant.location?.address || '주소 정보 없음';

  return (
    // 카드 컨테이너 (다크 모드 스타일 포함)
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:-translate-y-1 duration-300 flex flex-col h-full"> {/* h-full 추가 */}

      {/* '가고싶은 곳' 배지 (visited가 false일 때만 표시) */}
      {!restaurant.visited && (
        <span className="absolute top-2 right-2 z-10 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
          가고싶은 곳
        </span>
      )}

      {/* 맛집 이미지 */}
      <div className="flex-shrink-0">
          <img src={restaurant.imageUrl}
               alt={restaurant.name || '맛집 이미지'}
               className="w-full h-48 object-cover"
               // 이미지 로딩 실패 시 대체 텍스트 표시 (선택 사항)
               onError={(e) => { e.target.onerror = null; e.target.alt="이미지 로딩 실패"; /* 대체 이미지 경로 설정 가능 */ }}
           />
      </div>

      {/* 맛집 정보 섹션 */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        {/* 이름 */}
        <h2 className="text-lg sm:text-xl font-bold mb-1 text-gray-900 dark:text-white truncate" title={restaurant.name}>
          {restaurant.name || '이름 없음'}
        </h2>
        {/* 주소 */}
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 truncate" title={address}>
          {address}
        </p>
        {/* 별점 */}
        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`h-4 w-4 sm:h-5 sm:w-5 ${i < restaurant.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
          ))}
          <span className="ml-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">({restaurant.rating || 0})</span>
        </div>

        {/* 가격대 */}
        {restaurant.priceRange && PRICE_RANGE_LABELS[restaurant.priceRange] && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
            가격대: {restaurant.priceRange} ({PRICE_RANGE_LABELS[restaurant.priceRange]})
          </p>
        )}

        {/* 메모 (내용이 길 경우 잘릴 수 있음 - line-clamp 사용) */}
        <p className="text-gray-700 dark:text-gray-300 text-sm flex-grow mb-4 whitespace-pre-wrap line-clamp-3"> {/* line-clamp-3: 최대 3줄 */}
          {restaurant.memo || ''}
        </p>

        {/* 태그 목록 */}
        {/* 👇 태그 영역에 하단 마진 추가 (mb-4) */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {restaurant.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)} // 태그 클릭 시 필터링 함수 호출
                className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* ownerInfo가 있으면 표시 (작성자 버튼 등) */}
        {/* 👇 여기에 하단 마진 추가 (mb-4) */}
        {ownerInfo && <div className="mb-4">{ownerInfo}</div>}

        {/* 👇 showActions가 true일 때만 수정/삭제 버튼 영역 렌더링 */}
        {showActions && (
          <div className="mt-auto flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
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
  );
}

export default RestaurantCard;

