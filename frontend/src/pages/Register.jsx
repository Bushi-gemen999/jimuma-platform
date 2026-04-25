import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 表单输入变化
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // 提交注册
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.nickname) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/register', form);
      setSuccess('注册成功！即将跳转到登录页...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>注册 - 积木码</h2>
      
      {error && (
        <div style={{ color: '#ff4d4f', padding: '8px', background: '#fff2f0', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: '#52c41a', padding: '8px', background: '#f6ffed', borderRadius: '4px', marginBottom: '16px' }}>
          {success}
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
            placeholder="请设置用户名"
          />
        </div>
        
        <div className="form-item">
          <label>昵称</label>
          <input
            type="text"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="请设置显示昵称"
          />
        </div>
        
        <div className="form-item">
          <label>密码</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="请设置密码"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
        已有账号？<Link to="/login" style={{ color: '#1677ff' }}>立即登录</Link>
      </div>
    </div>
  );
}