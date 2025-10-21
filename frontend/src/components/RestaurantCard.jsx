import React from 'react';

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

function RestaurantCard({ restaurant, onEdit, onDelete, onTagClick }) {
  // 다크 모드 스타일 적용
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:-translate-y-2 duration-300 flex flex-col">
      <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-48 object-cover" />
      <div className="p-5 flex flex-col flex-grow">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{restaurant.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{restaurant.location.address}</p>
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`h-5 w-5 ${i < restaurant.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
          ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-base flex-grow mb-4 whitespace-pre-wrap">{restaurant.memo}</p>
        
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.tags.map((tag) => (
              <button 
                key={tag} 
                onClick={() => onTagClick(tag)}
                className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
          <button onClick={() => onEdit(restaurant)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs font-bold py-2 px-3 rounded-md transition-colors">수정</button>
          <button onClick={() => onDelete(restaurant._id)} className="bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-md transition-colors">삭제</button>
        </div>
      </div>
    </div>
  );
}

export default RestaurantCard;