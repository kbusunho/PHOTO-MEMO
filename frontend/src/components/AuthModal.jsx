import React, { useState } from 'react';
import '../styles/AuthModal.scss';

function AuthModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('login');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="auth-tabs">
            <button
              className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              로그인
            </button>
            <button
              className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              회원가입
            </button>
          </div>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="auth-form">
          {activeTab === 'signup' && (
            <input type="text" placeholder="닉네임" required />
          )}
          <input type="email" placeholder="이메일" required />
          <input type="password" placeholder="비밀번호" required />
          
          {activeTab === 'login' ? (
            <button type="submit" className="submit-button">
              로그인
            </button>
          ) : (
            <button type="submit" className="submit-button">
              가입하기
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default AuthModal;