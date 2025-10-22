import React, { useState } from 'react';

function RestaurantFormModal({ restaurant, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    address: restaurant?.location?.address || '',
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
        await onSave(formData, imageFile, tagsArray);
        onClose(); // 성공 시 모달 닫기
    } catch (error) {
        console.error("저장 실패 (모달)", error);
        // 실패 시 로딩만 풉니다 (오류는 HomePage의 toast가 처리)
    } finally {
        setLoading(false);
    }
  };

  return (
    // 모달 배경
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-20 p-4">
      {/* 모달 컨텐츠 */}
      {/* 👇 1. max-h-[90vh] 추가, flex flex-col 추가 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg relative animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
        {/* 모달 제목 */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex-shrink-0">{restaurant ? '맛집 수정' : '새 맛집 추가'}</h2>

        {/* 👇 2. 스크롤 영역 설정 (overflow-y-auto, flex-grow) */}
        <div className="overflow-y-auto flex-grow pr-2"> {/* pr-2는 스크롤바 공간 확보 */}
            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="mb-4">
                {/* 👇 이미지 최대 높이 제한 추가 (선택 사항) */}
                <img src={imagePreview} alt="미리보기" className="w-full max-h-60 object-cover rounded-md" />
              </div>
            )}

            {/* 입력 폼 */}
            <form id="restaurant-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="맛집 이름"
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {/* 주소 */}
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="위치 (예: 서울 강남구)"
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {/* 별점 */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">별점</label>
                <div className="flex items-center space-x-2">
                  <input type="range" name="rating" min="1" max="5" value={formData.rating} onChange={handleChange} className="w-full" />
                  <span className="text-yellow-500 dark:text-yellow-400 font-bold">{formData.rating}</span>
                </div>
              </div>
              {/* 메모 */}
              <textarea
                name="memo"
                value={formData.memo}
                onChange={handleChange}
                placeholder="나만의 메모..."
                rows="4"
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
              {/* 태그 */}
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
              {/* 사진 */}
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
            </form>
        </div> {/* 스크롤 영역 끝 */}

        {/* 👇 3. 저장 버튼 영역 (스크롤 영역 밖으로 이동) */}
        <div className="flex justify-end pt-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-6">
          <button
              // 👇 form 속성으로 폼과 연결
              form="restaurant-form"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
          >
              {loading ? '저장 중...' : '저장'}
          </button>
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
          /* 스크롤바 디자인 (선택 사항) */
          .overflow-y-auto::-webkit-scrollbar {
              width: 8px;
          }
          .overflow-y-auto::-webkit-scrollbar-track {
              background: transparent;
          }
          .overflow-y-auto::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5); /* gray-400/50 */
              border-radius: 20px;
              border: 3px solid transparent;
              background-clip: content-box;
          }
          .dark .overflow-y-auto::-webkit-scrollbar-thumb {
             background-color: rgba(107, 114, 128, 0.5); /* gray-500/50 */
          }
        `}</style>
      </div>
    </div>
  );
}

export default RestaurantFormModal;
