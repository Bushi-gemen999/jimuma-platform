import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ setUser }) {
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 表单输入变化
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // 提交登录
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/login', form);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>登录 - 积木码</h2>
      
      {error && (
        <div style={{ color: '#ff4d4f', padding: '8px', background: '#fff2f0', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-item">
          <label>用户名</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="请输入用户名"
          />
        </div>
        
        <div className="form-item">
          <label>密码</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="请输入密码"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
        还没有账号？<Link to="/register" style={{ color: '#1677ff' }}>立即注册</Link>
      </div>
    </div>
  );
}