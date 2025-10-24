import React, { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import Footer from '../components/Footer'; // Footer 임포트 확인

const LandingPage = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* 전체 페이지 컨테이너 */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-300">
        {/* main 태그 패딩 유지 */}
        <main className="flex items-center justify-center flex-grow px-4 sm:px-6 lg:px-8">
          {/* 상하 마진 my-10 유지 */}
          <div className="text-center max-w-6xl w-full my-10">

            {/* 히어로 섹션 */}
            {/* 👇 1. mb-12 -> mb-10 으로 수정 (아래쪽 마진 줄임) 👇 */}
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-10 md:p-16 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-10 transition-all duration-300">
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4 tracking-tight leading-tight">
                나만의 맛집 리스트 포토 메모
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                맛집의 모든 순간을 사진과 함께 기록하고, 똑똑하게 찾고, 친구들과 공유하며 미식의 즐거움을 더하세요.
              </p>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-12 rounded-full text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setShowModal(true)}
              >
                지금 시작하기
              </button>
            </section>

            {/* 기능 소개 섹션 */}
            {/* 👇 2. gap-6 -> gap-4 으로 수정 (카드 간 간격 줄임) */}
            <section className="flex flex-col md:flex-row gap-4">
              {/* 기능 카드 1 */}
              {/* 👇 3. p-6 -> p-4 으로 수정 (카드 내부 패딩 줄임) */}
              <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">나만의 미식 지도</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  사진, 별점, 상세 메모는 물론 태그, 가격대, 방문 여부/위시리스트까지. 나만의 완벽한 맛집 데이터를 기록하고 관리하세요.
                </p>
              </div>
              {/* 기능 카드 2 */}
              <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">스마트한 검색 & 관리</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  강력한 검색과 필터(태그, 방문/위시, 가격대), 다양한 정렬 기능으로 수많은 기록 속에서 원하는 맛집을 즉시 찾아보세요.
                </p>
              </div>
              {/* 기능 카드 3 */}
              <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">공유하고 탐색하기</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  인상 깊었던 맛집은 '공개'하여 프로필 링크로 친구에게 공유하고, '탐색' 페이지에서 다른 사람들의 추천 맛집을 발견하며 댓글로 소통해보세요!
                </p>
              </div>
            </section>

          </div>
        </main>

        <Footer />
      </div>

      <AuthModal show={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default LandingPage;

