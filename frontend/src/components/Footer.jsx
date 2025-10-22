import React from 'react';

// 아이콘 SVG 컴포넌트
const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const NotionIcon = () => ( // 노션 아이콘 SVG (Placeholder)
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
 </svg>
);


function Footer() {
  const currentYear = new Date().getFullYear();

  // 사용자 정보와 링크 (실제 값으로 수정 필요)
  const creatorName = "최선호";
  const email = "happysun0142@gmail.com";
  const phone = "010-4694-1136";
  const githubLink = "https://github.com/kbusunho/PHOTO-MEMO/tree/main";
  const notionLink = "https://kbusunho.notion.site/PHOTO-MEMO-Project-e279b22912f6a8013a354faf479c5a436?pvs=4"; // 실제 노션 링크로 가정
  const privacyPolicyLink = "#"; // 개인정보처리방침 링크 (없으면 '#')
  const termsLink = "#"; // 이용약관 링크 (없으면 '#')

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6 px-4">
      {/* 👇 1. flex 컨테이너 설정: 기본 세로, md 이상 가로 배치, 양쪽 정렬 */}
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-gray-600 dark:text-gray-400 text-sm space-y-4 md:space-y-0">

        {/* 왼쪽 영역: 개발자 정보, 소셜 링크 */}
        {/* 👇 2. 왼쪽 정렬 (md 이상) */}
        <div className="text-center md:text-left">
          <p className="font-semibold">{creatorName}</p>
          <p>
            Email: <a href={`mailto:${email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">{email}</a> |
            Phone: <span className="select-all">{phone}</span>
          </p>
          {/* 소셜 링크 */}
          <div className="flex justify-center md:justify-start items-center space-x-3 mt-2">
            {githubLink !== "#" && (
              <a href={githubLink} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors" title="GitHub">
                <GithubIcon />
              </a>
            )}
            {notionLink !== "#" && (
              <a href={notionLink} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors" title="Notion">
                <NotionIcon />
              </a>
            )}
          </div>
        </div>

        {/* 오른쪽 영역: 법적 고지, 저작권 */}
        {/* 👇 3. 오른쪽 정렬 (md 이상) */}
        <div className="text-center md:text-right">
          {/* 법적 고지 링크 */}
          <div className="space-x-4 mb-2">
            {privacyPolicyLink !== "#" && (
              <a href={privacyPolicyLink} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">개인정보처리방침</a>
            )}
            {termsLink !== "#" && (
              <a href={termsLink} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">이용약관</a>
            )}
          </div>
          {/* 저작권 표시 */}
          <p>&copy; {currentYear} 맛집 포토로그. All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;

