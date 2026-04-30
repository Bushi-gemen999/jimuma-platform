import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Editor from './pages/Editor.jsx';
import Profile from './pages/Profile.jsx';

// 全局axios配置（生产环境用 VITE_API_BASE_URL，回退到本地开发地址）
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 登录状态校验
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/user').then(res => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>;

  // 路由守卫
  const AuthRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar user={user} setUser={setUser} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/project/:id" element={<ProjectDetail user={user} />} />
          <Route path="/editor" element={<AuthRoute><Editor user={user} /></AuthRoute>} />
          <Route path="/profile" element={<AuthRoute><Profile user={user} /></AuthRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}