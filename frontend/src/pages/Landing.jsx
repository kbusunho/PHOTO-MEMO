import React, { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import './styles/Landing.scss';

function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <main className="landing-container">
        <section className="hero-section">
          <h1>포토메모</h1>
          <p>사진 한 장, 한 줄 메모. 태그 · 검색 · 공유까지.</p>
          <button className="start-button" onClick={openModal}>
            시작하기
          </button>
        </section>

        <section className="features-grid">
          <article className="feature-card">
            <h3>빠른 기록</h3>
            <p>이미지 업로드 후 한 줄 메모로 즉시 저장.</p>
          </article>
          <article className="feature-card">
            <h3>태그 & 검색</h3>
            <p>태그로 묶고 검색으로 바로 찾기.</p>
          </article>
          <article className="feature-card">
            <h3>간단 공유</h3>
            <p>공유 링크로 가볍게 전달.</p>
          </article>
        </section>
      </main>

      {isModalOpen && <AuthModal onClose={closeModal} />}
    </>
  );
}

export default Landing;