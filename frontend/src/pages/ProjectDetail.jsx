import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProjectDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');
  const [contribution, setContribution] = useState({ type: 'bug', content: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [collected, setCollected] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);

  // 获取项目详情
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/project/${id}`);
        setProject(res.data);
      } catch (err) {
        alert('项目不存在');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  // 获取收藏状态
  useEffect(() => {
    if (!user) return;
    axios.get(`/api/collection/${id}/status`).then(res => {
      setCollected(res.data.collected);
    }).catch(() => {});
  }, [id, user]);

  // 收藏 / 取消收藏
  const handleCollect = async () => {
    if (!user) { alert('请先登录'); navigate('/login'); return; }
    setCollectLoading(true);
    try {
      if (collected) {
        await axios.delete(`/api/collection/${id}`);
        setCollected(false);
      } else {
        await axios.post(`/api/collection/${id}`);
        setCollected(true);
      }
    } catch (err) {
      alert(err.response?.data?.msg || '操作失败');
    } finally {
      setCollectLoading(false);
    }
  };

  // 提交贡献（bug修复/功能优化）
  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    if (!contribution.content) {
      alert('请填写贡献内容');
      return;
    }
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    setSubmitLoading(true);
    try {
      await axios.post('/api/contribution', {
        project_id: id,
        type: contribution.type,
        content: contribution.content,
        score: contribution.type === 'bug' ? 10 : 15 // bug修复+10分，功能优化+15分
      });
      setContribution({ type: 'bug', content: '' });
      alert('提交成功！等待作者确认后即可获得贡献值');
    } catch (err) {
      alert(err.response?.data?.msg || '提交失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  if (!project) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>项目不存在</div>;
  }

  return (
    <div>
      {/* 项目基础信息 */}
      <div className="card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>{project.title}</h1>
            <div style={{ color: '#666', marginBottom: '8px' }}>
              作者：{project.nickname} | 
              类型：{project.type === 'idea' ? '创意构思' : '可运行项目'} |
              发布时间：{new Date(project.create_time).toLocaleString()}
            </div>
            {project.fork_from > 0 && (
              <div style={{ color: '#1677ff', marginBottom: '8px' }}>
                复刻自：<Link to={`/project/${project.fork_from}`}>项目{project.fork_from}</Link>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 收藏按钮 */}
            <button
              className={collected ? 'btn-primary' : 'btn-secondary'}
              onClick={handleCollect}
              disabled={collectLoading}
              style={{ minWidth: '90px' }}
            >
              {collectLoading ? '...' : collected ? '❤️ 已收藏' : '🤍 收藏'}
            </button>

            {user && (
              <>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/editor', { state: { project } })}
                >
                  在线编辑
                </button>
                <button 
                  className="btn-primary"
                  onClick={async () => {
                    // 一键复刻
                    if (window.confirm(`确定要复刻「${project.title}」吗？`)) {
                      try {
                        await axios.post('/api/project', {
                          title: `复刻：${project.title}`,
                          description: `基于${project.nickname}的创意进行二次创新`,
                          type: project.type,
                          content: project.content || '',
                          fork_from: project.id
                        });
                        alert('复刻成功！你可以在编辑器中修改创新');
                        navigate('/');
                      } catch (err) {
                        alert('复刻失败');
                      }
                    }
                  }}
                >
                  复刻创新
                </button>
              </>
            )}
          </div>
        </div>

        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e8e8e8' }}>
          {[
            { key: 'detail', label: '项目详情' },
            { key: 'bug', label: 'Bug修复' },
            { key: 'feature', label: '功能优化' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === item.key ? '2px solid #1677ff' : 'none',
                background: 'none',
                color: activeTab === item.key ? '#1677ff' : '#333',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 详情内容 */}
        {activeTab === 'detail' && (
          <div style={{ lineHeight: '1.8', color: '#333' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {project.description}
            </pre>
            
            {project.content && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '8px' }}>项目内容：</h4>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {project.content}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Bug修复 */}
        {activeTab === 'bug' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4>提交Bug修复方案</h4>
              <p style={{ color: '#666' }}>发现这个项目的bug？提交你的修复方案，帮助作者完善项目，获得贡献值！</p>
            </div>

            <form onSubmit={handleSubmitContribution}>
              <input type="hidden" value="bug" onChange={(e) => setContribution({...contribution, type: e.target.value})} />
              
              <div className="form-item">
                <label>Bug修复方案</label>
                <textarea
                  value={contribution.content}
                  onChange={(e) => setContribution({...contribution, content: e.target.value})}
                  placeholder="请详细描述你发现的bug，以及修复方案（可以是文字描述、积木配置或代码）"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="btn-primary"
                disabled={submitLoading || !user}
              >
                {submitLoading ? '提交中...' : user ? '提交修复方案' : '登录后提交'}
              </button>
            </form>
          </div>
        )}

        {/* 功能优化 */}
        {activeTab === 'feature' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4>提交功能优化方案</h4>
              <p style={{ color: '#666' }}>有更好的创意？提交你的功能优化方案，让项目更完善，获得贡献值！</p>
            </div>

            <form onSubmit={handleSubmitContribution}>
              <input type="hidden" value="feature" onChange={(e) => setContribution({...contribution, type: e.target.value})} />
              
              <div className="form-item">
                <label>功能优化方案</label>
                <textarea
                  value={contribution.content}
                  onChange={(e) => setContribution({...contribution, content: e.target.value})}
                  placeholder="请详细描述你想新增/优化的功能，以及实现方案（可以是文字描述、积木配置或代码）"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="btn-primary"
                disabled={submitLoading || !user}
              >
                {submitLoading ? '提交中...' : user ? '提交优化方案' : '登录后提交'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}