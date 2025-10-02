import React from 'react';
import AuthPanel from './AuthPanel.jsx';
import './styles/AuthModal.scss';

const AuthModal = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <AuthPanel onClose={onClose} />
      </div>
    </div>
  );
};

export default AuthModal;