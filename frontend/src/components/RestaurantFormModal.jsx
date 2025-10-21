import React, { useState } from 'react';

function RestaurantFormModal({ restaurant, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    address: restaurant?.location?.address || '', // 'address'로 받음
    rating: restaurant?.rating || 3,
    memo: restaurant?.memo || '',
    tags: restaurant?.tags?.join(', ') || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(restaurant?.imageUrl || null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'rating' ? parseInt(value) : value }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
        // onSave가 promise를 반환하므로 await
        await onSave(formData, imageFile, tagsArray);
        // onSave가 성공적으로 끝나면 모달을 닫습니다. (실패 시는 HomePage에서 throw하므로 닫히지 않음)
        onClose(); 
    } catch (error) {
        console.error("저장 실패 (모달)", error);
        // HomePage의 toast에서 오류를 표시하므로 여기선 로딩만 풉니다.
    } finally {
        setLoading(false);
    }
  };

  // 다크 모드 스타일 적용
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-20 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{restaurant ? '맛집 수정' : '새 맛집 추가'}</h2>
        
        {imagePreview && (
          <div className="mb-4">
            <img src={imagePreview} alt="미리보기" className="w-full h-48 object-cover rounded-md" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="맛집 이름" 
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            required 
          />
          <input 
            type="text" 
            name="address" // 'address'로 변경
            value={formData.address} 
            onChange={handleChange} 
            placeholder="위치 (예: 서울 강남구)" 
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">별점</label>
            <div className="flex items-center space-x-2">
              <input type="range" name="rating" min="1" max="5" value={formData.rating} onChange={handleChange} className="w-full" />
              <span className="text-yellow-500 dark:text-yellow-400 font-bold">{formData.rating}</span>
            </div>
          </div>
          <textarea 
            name="memo" 
            value={formData.memo} 
            onChange={handleChange} 
            placeholder="나만의 메모..." 
            rows="4" 
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">태그</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="예: 강남, 파스타, 데이트 (쉼표로 구분)"
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">사진</label>
              <input 
                type="file" 
                onChange={handleImageChange} 
                accept="image/*"
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700"
                required={!restaurant} 
              />
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
            >
                {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
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

export default RestaurantFormModal;