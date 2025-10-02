import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios 요청 인터셉터 설정
client.interceptors.request.use(
  (config) => {
    // 요청을 보내기 전에 localStorage에서 토큰을 가져옵니다.
    const token = localStorage.getItem('authToken');
    
    // 토큰이 있으면 Authorization 헤더를 설정합니다.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // 요청 에러 처리
    return Promise.reject(error);
  }
);

export default client;