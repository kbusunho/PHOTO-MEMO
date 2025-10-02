import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPhotos, uploadPhoto } from '../api/photos.js';
import './styles/DashboardPage.scss';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 내 사진 목록 불러오기
  const fetchPhotos = async () => {
    try {
      const userPhotos = await getPhotos();
      setPhotos(userPhotos);
    } catch (error) {
      console.error("사진을 불러오는데 실패했습니다.", error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠어요?')) {
      logout();
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      return alert('업로드할 사진을 선택해주세요.');
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file); // 'image'는 백엔드 upload.single('image')와 일치해야 함
    formData.append('title', title);
    formData.append('description', description);

    try {
      await uploadPhoto(formData);
      // 업로드 성공 후 상태 초기화 및 사진 목록 다시 불러오기
      setFile(null);
      setTitle('');
      setDescription('');
      document.getElementById('file-upload').value = null; // 파일 인풋 초기화
      await fetchPhotos(); 
    } catch (error) {
      console.error("업로드에 실패했습니다.", error);
      alert('업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (photoId, photoTitle) => {
    // TODO: 삭제 API 구현
    alert('삭제 기능은 현재 개발 중입니다.');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">📷 Photomemo</div>
        <div className="user-actions">
          <span>{user?.nickname || user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">로그아웃</button>
        </div>
      </header>
      <main className="dashboard-main">
        <section className="upload-section">
          <form className="upload-form" onSubmit={handleUpload}>
            <div className="form-group file-input">
              <label htmlFor="file-upload" className="file-label">파일 선택</label>
              <input id="file-upload" type="file" onChange={(e) => setFile(e.target.files[0])} />
              <span>{file ? file.name : '선택된 파일 없음'}</span>
            </div>
            <div className="form-group">
              <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <input type="text" placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="upload-btn" disabled={loading}>
              {loading ? '업로드 중...' : '업로드'}
            </button>
          </form>
        </section>
        <section className="photo-list-section">
          <h2>내 사진첩</h2>
          <div className="photo-grid">
            {photos.map((photo) => (
              <div className="photo-card" key={photo._id}>
                <img src={photo.imageUrl} alt={photo.title} />
                <div className="photo-info">
                  <h3>{photo.title}</h3>
                  <p>{photo.description}</p>
                  <div className="photo-actions">
                    <button className="open-btn">열기</button>
                    <button className="delete-btn" onClick={() => handleDelete(photo._id, photo.title)}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;