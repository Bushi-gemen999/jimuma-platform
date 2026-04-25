import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Avatar, Tabs, List, Tag, Button, Empty, Spin, Statistic, Row, Col, message, Badge } from 'antd';
import { UserOutlined, TrophyOutlined, BookOutlined, HeartOutlined, HeartFilled, EditOutlined, EyeOutlined } from '@ant-design/icons';

export default function Profile({ user }) {
  const [myProjects, setMyProjects] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [loading, setLoading] = useState({ projects: true, contributions: true, collections: true });
  const navigate = useNavigate();

  // 获取我的项目
  useEffect(() => {
    axios.get('/api/projects').then(res => {
      setMyProjects(res.data.filter(p => p.user_id === user.id));
    }).catch(() => message.error('获取项目失败')).finally(() => {
      setLoading(prev => ({ ...prev, projects: false }));
    });
  }, [user.id]);

  // 获取我的贡献记录
  useEffect(() => {
    axios.get('/api/contributions/mine').then(res => {
      setMyContributions(res.data);
    }).catch(() => message.error('获取贡献记录失败')).finally(() => {
      setLoading(prev => ({ ...prev, contributions: false }));
    });
  }, []);

  // 获取我的收藏
  useEffect(() => {
    axios.get('/api/collections/mine').then(res => {
      setMyCollections(res.data);
    }).catch(() => message.error('获取收藏失败')).finally(() => {
      setLoading(prev => ({ ...prev, collections: false }));
    });
  }, []);

  // 取消收藏
  const handleUncollect = async (projectId) => {
    try {
      await axios.delete(`/api/collection/${projectId}`);
      setMyCollections(prev => prev.filter(p => p.id !== projectId));
      message.success('已取消收藏');
    } catch (err) {
      message.error(err.response?.data?.msg || '操作失败');
    }
  };

  // 贡献类型颜色
  const contribTypeColor = { bug: 'red', feature: 'blue' };
  const contribTypeLabel = { bug: 'Bug修复', feature: '功能优化' };
  const contribStatusLabel = { 0: '待确认', 1: '已确认' };

  const tabItems = [
    {
      key: 'projects',
      label: (
        <span><EditOutlined /> 我的创作 <Badge count={myProjects.length} showZero color="#1677ff" /></span>
      ),
      children: loading.projects ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Spin /></div>
      ) : myProjects.length === 0 ? (
        <Empty description="还没有发布任何创意/项目">
          <Button type="primary" onClick={() => navigate('/editor')}>去发布第一个创意</Button>
        </Empty>
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={myProjects}
          renderItem={item => (
            <List.Item>
              <Card
                hoverable
                title={item.title}
                extra={<Tag color={item.type === 'idea' ? 'orange' : 'blue'}>{item.type === 'idea' ? '创意构思' : item.type}</Tag>}
                actions={[
                  <span key="view" onClick={() => navigate(`/project/${item.id}`)}><EyeOutlined /> 查看详情</span>,
                  <span key="edit" onClick={() => navigate('/editor', { state: { project: item } })}><EditOutlined /> 编辑</span>
                ]}
              >
                <p style={{ color: '#666', height: '40px', overflow: 'hidden', marginBottom: 0 }}>
                  {item.description}
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  {new Date(item.create_time).toLocaleString()}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'contributions',
      label: (
        <span><TrophyOutlined /> 我的贡献 <Badge count={myContributions.filter(c => c.status === 1).length} showZero color="green" /></span>
      ),
      children: loading.contributions ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Spin /></div>
      ) : myContributions.length === 0 ? (
        <Empty description="还没有提交过任何贡献">
          <Button type="primary" onClick={() => navigate('/')}>去广场帮助他人</Button>
        </Empty>
      ) : (
        <List
          dataSource={myContributions}
          renderItem={item => (
            <List.Item
              extra={
                <Tag color={item.status === 1 ? 'green' : 'default'}>
                  {contribStatusLabel[item.status]}
                  {item.status === 1 ? ` +${item.score}分` : ''}
                </Tag>
              }
            >
              <List.Item.Meta
                title={
                  <span>
                    <Tag color={contribTypeColor[item.type]}>{contribTypeLabel[item.type]}</Tag>
                    <Link to={`/project/${item.project_id}`}>{item.project_title}</Link>
                  </span>
                }
                description={
                  <div>
                    <div style={{ color: '#555', marginBottom: '4px' }}>{item.content.length > 100 ? item.content.slice(0, 100) + '...' : item.content}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{new Date(item.create_time).toLocaleString()}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'collections',
      label: (
        <span><HeartOutlined /> 我的收藏 <Badge count={myCollections.length} showZero color="red" /></span>
      ),
      children: loading.collections ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Spin /></div>
      ) : myCollections.length === 0 ? (
        <Empty description="还没有收藏任何项目">
          <Button type="primary" onClick={() => navigate('/')}>去广场发现好项目</Button>
        </Empty>
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={myCollections}
          renderItem={item => (
            <List.Item>
              <Card
                hoverable
                title={item.title}
                extra={<Tag color="blue">{item.type}</Tag>}
                actions={[
                  <span key="view" onClick={() => navigate(`/project/${item.id}`)}><EyeOutlined /> 查看</span>,
                  <span key="uncollect" style={{ color: '#ff4d4f' }} onClick={() => handleUncollect(item.id)}>
                    <HeartFilled /> 取消收藏
                  </span>
                ]}
              >
                <p style={{ color: '#666', height: '40px', overflow: 'hidden', marginBottom: 0 }}>
                  {item.description}
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  作者：{item.nickname} · 收藏于 {new Date(item.collected_at).toLocaleDateString()}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )
    }
  ];

  return (
    <div>
      {/* 个人信息卡片 */}
      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar
              size={80}
              style={{ background: '#1677ff', fontSize: '28px' }}
              icon={<UserOutlined />}
            >
              {user.nickname?.substring(0, 1)}
            </Avatar>
          </Col>
          <Col flex="1">
            <h2 style={{ marginBottom: '4px' }}>{user.nickname}</h2>
            <div style={{ color: '#888', marginBottom: '12px' }}>@{user.username}</div>
            <Row gutter={32}>
              <Col>
                <Statistic
                  title="总贡献值"
                  value={user.contribution}
                  prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col>
                <Statistic title="发布项目" value={myProjects.length} prefix={<BookOutlined />} />
              </Col>
              <Col>
                <Statistic title="贡献次数" value={myContributions.length} prefix={<TrophyOutlined />} />
              </Col>
              <Col>
                <Statistic
                  title="获确认贡献"
                  value={myContributions.filter(c => c.status === 1).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 内容 Tabs */}
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
