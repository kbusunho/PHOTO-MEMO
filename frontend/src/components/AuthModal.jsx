import React from 'react';
import AuthPanel from './AuthPanel.jsx';

const AuthModal = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  // 모달 바깥쪽 클릭 시 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 p-4"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <AuthPanel onClose={onClose} />
      </div>
    </div>
  );
};

export default AuthModal;