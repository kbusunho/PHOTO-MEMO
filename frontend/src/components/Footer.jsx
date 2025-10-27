import React from 'react';

// GitHub 아이콘 SVG
const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

// Notion 아이콘 SVG
const NotionIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M19.999 4.089C19.999 3.486 19.512 3 18.909 3H5.091C4.488 3 4 3.487 4 4.09V19.91C4 20.513 4.487 21 5.09 21H18.91C19.513 21 20 20.513 20 19.91L20 9.773L19.999 4.089ZM14.471 6.307C14.471 5.923 14.159 5.611 13.775 5.611H10.198C9.814 5.611 9.502 5.923 9.502 6.307V17.691C9.502 18.075 9.814 18.387 10.198 18.387H11.01V11.231L13.774 18.387H14.47V6.307H14.471Z"/>
  </svg>
);


function Footer() {
  const currentYear = new Date().getFullYear();

  // 사용자 정보 및 링크
  const creatorName = "개발자:최선호 / 문의는 아래 참고";
  const email = "happysun0142@gmail.com";
  const phone = "010-4694-1136";
  const githubLink = "https://github.com/kbusunho/PHOTO-MEMO/tree/main";
  const notionLink = "https://www.notion.so/PHOTO-MEMO-Project-279b22912f6a8013a354faf479c5a436?source=copy_link";
  const privacyPolicyLink = "#";
  const termsLink = "#";

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6 px-4">
      {/* container 안에 flex 레이아웃 적용 */}
      <div className="container mx-auto text-gray-600 dark:text-gray-400 text-sm 
                    flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

        {/* 왼쪽 영역: 정보 및 소셜 링크 */}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-center md:text-left">
          {/* 만든 사람 정보 */}
          <div>
            <p className="font-semibold">{creatorName}</p>
            
            {/* 👇 1. <p> 태그를 <div>로 변경하고, 자식 요소들을 block 또는 inline-block으로 처리 */}
            <div className="flex flex-col sm:flex-row sm:space-x-2 justify-center md:justify-start">
              {/* 이메일 (break-all로 강제 줄바꿈) */}
              <span className="break-all">
                Email: <a href={`mailto:${email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">{email}</a>
              </span>
              {/* 구분자 (모바일에서 숨김) */}
              <span className="hidden sm:inline">|</span> 
              {/* 전화번호 (줄바꿈 안 함) */}
              <span className="whitespace-nowrap">
                Phone: <span className="select-all">{phone}</span>
              </span>
            </div>
            {/* 👆 여기까지 수정 */}

          </div>
          {/* 관련 소셜 링크 */}
          <div className="flex items-center space-x-3">
            {githubLink !== "#" && (
              <a href={githubLink} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white" title="GitHub">
                <GithubIcon />
              </a>
            )}
            {notionLink !== "#" && (
              <a href={notionLink} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white" title="Notion">
                <NotionIcon />
              </a>
            )}
          </div>
        </div>

        {/* 오른쪽 영역: 저작권 및 법적 고지 */}
        <div className="text-center md:text-right">
          {/* 법적 고지 링크 */}
          <div className="space-x-4 mb-1">
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

