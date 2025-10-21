import React, { useState } from 'react';

function RestaurantFormModal({ restaurant, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    location: restaurant?.location || '',
    rating: restaurant?.rating || 3,
    memo: restaurant?.memo || '',
    // 👇 1. 'tags' 상태 추가 (배열을 쉼표로 구분된 문자열로 변환)
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
      // FileReader를 사용해 미리보기 URL 생성
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

    // 👇 2. 'tags' 문자열을 배열로 변환
    const tagsArray = formData.tags
      .split(',') // 쉼표로 자르기
      .map(tag => tag.trim()) // 양쪽 공백 제거
      .filter(tag => tag.length > 0); // 빈 태그 제거

    try {
        // 👇 3. onSave로 formData, imageFile, tagsArray를 전달
        // HomePage에서 이 데이터들을 FormData로 감싸서 보낼 겁니다.
        await onSave(formData, imageFile, tagsArray);
    } catch (error) {
        console.error("저장 실패 (모달)", error);
        // 실패 시 로딩 스피너만 멈춤 (모달은 안 닫힘)
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{restaurant ? '맛집 수정' : '새 맛집 추가'}</h2>
        
        {/* 이미지 미리보기 */}
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
            className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            required 
          />
          <input 
            type="text" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="위치 (예: 서울 강남구)" 
            className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">별점</label>
            <div className="flex items-center space-x-2">
              <input type="range" name="rating" min="1" max="5" value={formData.rating} onChange={handleChange} className="w-full" />
              <span className="text-yellow-400 font-bold">{formData.rating}</span>
            </div>
          </div>
          <textarea 
            name="memo" 
            value={formData.memo} 
            onChange={handleChange} 
            placeholder="나만의 메모..." 
            rows="4" 
            className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>

          {/* 👇 4. 태그 입력 필드 추가 👇 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">태그</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="예: 강남, 파스타, 데이트 (쉼표로 구분)"
              className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">사진</label>
              <input 
                type="file" 
                onChange={handleImageChange} 
                accept="image/*"
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                // 새로 추가할 때는 이미지가 필수, 수정할 때는 선택
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