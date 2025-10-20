import client from './client.js';

// 내 맛집 기록들 불러오기
export const getRestaurants = async () => {
  const response = await client.get('/api/photos');
  return response.data;
};

// 맛집 기록 업로드 (FormData)
export const uploadRestaurant = async (formData) => {
  const response = await client.post('/api/photos', formData, {
    headers: {
      // client.js 인터셉터가 토큰을 처리하므로, 여기서는 Content-Type만 명시합니다.
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 맛집 기록 수정 (FormData)
export const updateRestaurant = async (id, formData) => {
    const response = await client.put(`/api/photos/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

// 맛집 기록 삭제
export const deleteRestaurant = async (id) => {
    const response = await client.delete(`/api/photos/${id}`);
    return response.data;
}