import React, { useState } from 'react';

// 가격대 옵션 및 라벨 (백엔드 모델과 일치)
const PRICE_RANGE_OPTIONS = ['₩', '₩₩', '₩₩₩', '₩₩₩₩'];
const PRICE_RANGE_LABELS = {
  '₩': '만원 이하',
  '₩₩': '1~3만원',
  '₩₩₩': '3~5만원',
  '₩₩₩₩': '5만원 이상',
};

/**
 * 맛집 추가 또는 수정을 위한 모달 컴포넌트
 * @param {object} restaurant - 수정할 맛집 정보 (없으면 null)
 * @param {function} onClose - 모달 닫기 함수
 * @param {function} onSave - 저장 버튼 클릭 시 호출될 함수 (formData, imageFile, tagsArray 전달)
 */
function RestaurantFormModal({ restaurant, onClose, onSave }) {
  // 폼 데이터 상태 초기화
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    address: restaurant?.location?.address || '', // 백엔드 스키마 구조 반영
    rating: restaurant?.rating || 3,
    memo: restaurant?.memo || '',
    tags: restaurant?.tags?.join(', ') || '',
    visited: restaurant ? String(restaurant.visited) : 'true', // visited 상태 추가 (문자열 'true'/'false')
    isPublic: restaurant ? String(restaurant.isPublic) : 'false', // isPublic 상태 추가 (문자열 'true'/'false')
    priceRange: restaurant?.priceRange || '', // priceRange 상태 추가
  });
  const [imageFile, setImageFile] = useState(null); // 이미지 파일 상태
  const [imagePreview, setImagePreview] = useState(restaurant?.imageUrl || null); // 이미지 미리보기 URL 상태
  const [loading, setLoading] = useState(false); // 저장 로딩 상태

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // 라디오 버튼(visited, isPublic)은 value를 그대로 사용
    if (name === 'visited' || name === 'isPublic') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      // 그 외 필드는 type에 따라 처리 (별점은 숫자, 나머지는 문자열)
      setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : (name === 'rating' ? parseInt(value) : value)
      }));
    }
  };

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // 파일 상태 업데이트
      // 파일 리더로 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // 미리보기 URL 상태 업데이트
      };
      reader.readAsDataURL(file);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 동작 방지
    setLoading(true); // 로딩 시작

    // 태그 문자열을 배열로 변환 (쉼표 구분, 공백 제거, 빈 값 제거)
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
        // 부모 컴포넌트(HomePage)로 폼 데이터, 이미지 파일, 태그 배열 전달
        // onSave는 Promise를 반환하므로 await 사용
        await onSave(formData, imageFile, tagsArray);
        onClose(); // 저장 성공 시 모달 닫기
    } catch (error) {
        console.error("저장 실패 (모달)", error);
        // 오류는 HomePage의 toast에서 처리하므로 여기선 로딩만 해제
    } finally {
        setLoading(false); // 로딩 종료
    }
  };

  return (
    // 모달 배경 (어둡게 처리)
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-20 p-4">
      {/* 모달 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg relative animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors">&times;</button>
        {/* 모달 제목 */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex-shrink-0">{restaurant ? '맛집 수정' : '새 맛집 추가'}</h2>

        {/* 스크롤 가능한 영역 */}
        <div className="overflow-y-auto flex-grow pr-2 -mr-2"> {/* 스크롤바 공간 확보 및 숨김 */}
            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="mb-4">
                <img src={imagePreview} alt="미리보기" className="w-full max-h-60 object-cover rounded-md" />
              </div>
            )}

            {/* 입력 폼 */}
            <form id="restaurant-form" onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">맛집 이름 *</label>
                  <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="맛집 이름" required
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {/* 주소 */}
              <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">주소 *</label>
                  <input id="address" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="위치 (예: 서울 강남구)" required
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {/* 별점 */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">별점 *</label>
                <div className="flex items-center space-x-2">
                  <input type="range" name="rating" min="1" max="5" value={formData.rating} onChange={handleChange} className="w-full cursor-pointer" />
                  <span className="text-yellow-500 dark:text-yellow-400 font-bold w-4 text-center">{formData.rating}</span>
                </div>
              </div>
              {/* 메모 */}
               <div>
                   <label htmlFor="memo" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">메모</label>
                  <textarea id="memo" name="memo" value={formData.memo} onChange={handleChange} placeholder="나만의 메모..." rows="3"
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
              {/* 태그 */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">태그</label>
                <input id="tags" type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="예: 강남, 파스타, 데이트 (쉼표로 구분)"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {/* 방문 여부 */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">방문 상태 *</label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" name="visited" value="true" checked={formData.visited === 'true'} onChange={handleChange} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">방문 완료</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" name="visited" value="false" checked={formData.visited === 'false'} onChange={handleChange} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">가고 싶은 곳</span>
                  </label>
                </div>
              </div>
              {/* 가격대 */}
              <div>
                  <label htmlFor="priceRange" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">가격대</label>
                  <select id="priceRange" name="priceRange" value={formData.priceRange} onChange={handleChange}
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option value="">-- 가격대 선택 --</option>
                    {PRICE_RANGE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option} ({PRICE_RANGE_LABELS[option]})</option>
                    ))}
                  </select>
              </div>
              {/* 공개 여부 */}
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">공개 설정 *</label>
                 <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" name="isPublic" value="false" checked={formData.isPublic === 'false'} onChange={handleChange} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">비공개 (나만 보기)</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" name="isPublic" value="true" checked={formData.isPublic === 'true'} onChange={handleChange} className="form-radio text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">공개 (프로필에 표시)</span>
                  </label>
                </div>
              </div>
              {/* 사진 */}
              <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">사진 {restaurant ? '(선택)' : '*'} </label>
                  <input type="file" onChange={handleImageChange} accept="image/*" required={!restaurant}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700 cursor-pointer" />
              </div>
            </form>
        </div>

        {/* 저장 버튼 영역 */}
        <div className="flex justify-end pt-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-6">
          <button form="restaurant-form" type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
          /* 스크롤바 디자인 */
          .overflow-y-auto::-webkit-scrollbar { width: 6px; }
          .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
          .overflow-y-auto::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
          .dark .overflow-y-auto::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.5); }
        `}</style>
      </div>
    </div>
  );
}

export default RestaurantFormModal;

