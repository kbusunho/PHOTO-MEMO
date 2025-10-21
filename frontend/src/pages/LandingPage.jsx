import React, { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-white p-4">
        <main className="text-center max-w-4xl w-full">
          <section className="bg-gray-50 p-8 md:p-12 rounded-lg border border-gray-200 mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
              나만의 맛집 리스트 포토 메모
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              나만의 맛집을 사진과 함께 기록하고 손쉽게 관리해보세요.
            </p>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-lg text-lg transition-transform transform hover:scale-105"
              onClick={() => setShowModal(true)}
            >
              시작하기
            </button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">다양한 정보 기록</h3>
              <p className="text-gray-600"> {/* 이 부분이 올바르게 수정되었습니다. */}
                식당 이름, 위치, 사진, 별점, 나만의 메모까지 상세 정보를 기록하세요.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">손쉬운 관리</h3>
              <p className="text-gray-600"> {/* 이 부분이 올바르게 수정되었습니다. */}
                언제 어디서든 새로운 맛집을 추가하고 다크모드로 눈 피로를 줄이고 기존 기록을 수정,삭제할 수 있습니다.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">나만의 아카이브</h3>
              <p className="text-gray-600"> {/* 이 부분이 올바르게 수정되었습니다. */}
                방문했던 맛집들을 한눈에 모아보고 나만의 미식 여정을 완성하세요.
              </p>
            </div>
          </section>
        </main>
      </div>
      <AuthModal show={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default LandingPage;