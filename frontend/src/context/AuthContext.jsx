import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/auth.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 이제는 페이지 로드 시 토큰을 헤더에 설정할 필요가 없습니다.
      // 인터셉터가 모든 요청에 대해 자동으로 처리해줍니다.
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error("유효하지 않은 토큰입니다.", error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (credentials) => {
    const { token, user } = await apiLogin(credentials);
    localStorage.setItem('authToken', token);
    // 여기서도 헤더를 설정할 필요가 없습니다.
    setUser(user);
  };
  
  const signup = async (userInfo) => {
    await apiSignup(userInfo);
    await login({ email: userInfo.email, password: userInfo.password });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = { user, loading, login, logout, signup };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};