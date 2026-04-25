import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav style={{ background: 'white', padding: '0 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
        {/* 左侧LOGO */}
        <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677ff', textDecoration: 'none' }}>
          积木码 - 人人都能当程序员
        </Link>

        {/* 右侧导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>首页</Link>
          
          {user ? (
            <>
              <Link to="/editor" style={{ color: '#1677ff', textDecoration: 'none' }}>创建项目</Link>
              <Link to="/profile" style={{ color: '#333', textDecoration: 'none' }}>
                {user.nickname} (贡献值: {user.contribution})
              </Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                退出登录
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#333', textDecoration: 'none' }}>登录</Link>
              <Link to="/register" style={{ color: '#1677ff', textDecoration: 'none' }}>注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}