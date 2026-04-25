import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Space, Tag, Avatar, List, message, Spin } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

export default function Home({ user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // 正确定义发布按钮的加载状态，解构顺序不能反
  const [publishLoading, setPublishLoading] = useState(false);
  const navigate = useNavigate();

  // 获取项目列表
  const getProjectList = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      message.error('获取创意广场列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取列表
  useEffect(() => {
    getProjectList();
  }, []);

  // 发布按钮点击事件（修复了加载状态的调用错误）
  const handlePublish = () => {
    // 校验登录状态
    if (!user) {
      message.warning('请先登录账号，再发布创意');
      navigate('/login');
      return;
    }
    // 跳转到编辑器发布
    navigate('/editor');
  };

  // 跳转到项目详情
  const goToDetail = (id) => {
    navigate(`/project/${id}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      {/* 顶部横幅+发布按钮（修复了antd废弃属性警告） */}
      <Card 
        style={{ marginBottom: '20px', textAlign: 'center' }}
        styles={{ body: { padding: '40px 20px' } }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#1677ff' }}>积木码创意广场</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          分享你的创意，和开发者一起协作，把想法变成现实
        </p>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />}
          onClick={handlePublish}
          loading={publishLoading}
        >
          发布创意/项目
        </Button>
      </Card>

      {/* 项目列表 */}
      <List
        grid={{ gutter: 20, column: 3 }}
        dataSource={projects}
        renderItem={(item) => (
          <List.Item>
            <Card 
              hoverable
              onClick={() => goToDetail(item.id)}
              title={item.title}
              extra={<Tag color="blue">{item.type}</Tag>}
            >
              <p style={{ color: '#666', height: '44px', overflow: 'hidden', marginBottom: '16px' }}>
                {item.description}
              </p>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ fontSize: '12px', color: '#888' }}>{item.nickname}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>贡献值：{item.user_contribution}</span>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      {/* 空状态 */}
      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          还没有创意项目，快来发布第一个吧！
        </div>
      )}
    </div>
  );
}