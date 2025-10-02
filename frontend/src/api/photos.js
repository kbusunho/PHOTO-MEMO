import client from './client.js';

// 내 사진들 불러오기
export const getPhotos = async () => {
  const response = await client.get('/api/photos');
  return response.data;
};

// 사진 업로드
export const uploadPhoto = async (formData) => {
  const response = await client.post('/api/photos', formData, {
    // headers 객체를 수정합니다.
    headers: {
      // ...client.defaults.headers.common 은 기존 헤더(Authorization 포함)를 그대로 유지하라는 의미입니다.
      ...client.defaults.headers.common,
      // 파일 업로드를 위한 Content-Type 헤더를 추가합니다.
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};