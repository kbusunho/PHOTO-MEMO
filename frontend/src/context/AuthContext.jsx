import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/auth.js';
import client from '../api/client.js'; // client 임포트 (헤더 설정용이었으나 이젠 인터셉터가 처리)

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // 인터셉터가 헤더를 설정해주므로 getMe()만 호출
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
    // credentials: { email, password }
    const { token, user } = await apiLogin(credentials);
    localStorage.setItem('authToken', token);
    setUser(user);
    return user; // 로그인 성공 시 user 객체 반환
  };
  
  const signup = async (userInfo) => {
    // userInfo: { email, password, nickname }
    await apiSignup(userInfo);
    // 회원가입 성공 후 바로 로그인 처리
    await login({ email: userInfo.email, password: userInfo.password });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = { user, loading, login, logout, signup };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};