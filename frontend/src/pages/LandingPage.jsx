import React, { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import './styles/LandingPage.scss';

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="landing-container">
        <main className="landing-main">
          <section className="hero-section">
            {/* 수정된 부분: 프로젝트 이름과 설명 변경 */}
            <h1>나만의 맛집 리스트 포토 메모</h1>
            <p>나만의 맛집을 사진과 함께 기록하고 손쉽게 관리해보세요.</p>
            <button className="start-button" onClick={() => setShowModal(true)}>
              시작하기
            </button>
          </section>
          <section className="features-section">
            {/* 수정된 부분: 기능 설명 변경 */}
            <div className="feature-card">
              <h3>다양한 정보 기록</h3>
              <p>식당 이름, 사진, 방문일, 평점, 가격, 태그 등 상세 정보를 기록하세요.</p>
            </div>
            <div className="feature-card">
              <h3>위치  기록</h3>
              <p>가게 위치를 지도로 표시하고 기록할 수 있습니다.</p>
            </div>
            <div className="feature-card">
              <h3>태그 & 검색</h3>
              <p>자주 사용하는 태그로 묶고, 강력한 검색 기능으로 맛집을 바로 찾아보세요.</p>
            </div>
          </section>
        </main>
      </div>
      <AuthModal show={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default LandingPage;