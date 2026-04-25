import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
// 修正6.1.1版本的正确导入路径
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 路径配置（适配ES模块）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const dbPath = join(__dirname, 'jimuma_db.json');
const adapter = new JSONFile(dbPath);

// 初始化数据库，直接传入默认结构
const db = new Low(adapter, {
  users: [],
  projects: [],
  contributions: [],
  collections: []
});

// 读取数据库文件，没有的话自动创建默认结构
await db.read();
await db.write();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'jimuma_your_custom_secret_2024';

// 中间件
app.use(cors());
app.use(express.json());

console.log('✅ 积木码数据库初始化成功');

// 鉴权中间件
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: '请先登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: '登录失效，请重新登录' });
  }
};

// ==================== 接口列表（和之前完全一致，前端不用改） ====================
// 1. 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password || !nickname) return res.status(400).json({ msg: '请填写完整信息' });

  // 检查用户名是否存在
  const existUser = db.data.users.find(u => u.username === username);
  if (existUser) return res.status(400).json({ msg: '用户名已存在' });

  // 加密密码
  const hashPassword = await bcrypt.hash(password, 10);
  // 新增用户
  const newUser = {
    id: Date.now(), // 用时间戳生成唯一ID
    username,
    password: hashPassword,
    nickname,
    contribution: 0,
    create_time: new Date().toISOString()
  };
  db.data.users.push(newUser);
  await db.write();

  res.json({ msg: '注册成功' });
});

// 2. 用户登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // 查找用户
  const user = db.data.users.find(u => u.username === username);
  if (!user) return res.status(400).json({ msg: '用户不存在' });

  // 校验密码
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: '密码错误' });

  // 生成token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      username: user.username, 
      nickname: user.nickname, 
      contribution: user.contribution 
    } 
  });
});

// 3. 获取当前用户信息
app.get('/api/user', auth, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(400).json({ msg: '获取用户信息失败' });
  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    contribution: user.contribution
  });
});

// 4. 发布创意/项目
app.post('/api/project', auth, async (req, res) => {
  const { title, description, type, content, fork_from = 0 } = req.body;
  
  const newProject = {
    id: Date.now(),
    user_id: req.user.id,
    title,
    description,
    type,
    content: content || '',
    is_open: 1,
    fork_from,
    create_time: new Date().toISOString()
  };

  db.data.projects.push(newProject);
  // 发布项目增加贡献值
  const user = db.data.users.find(u => u.id === req.user.id);
  user.contribution += 10;
  await db.write();

  res.json({ msg: '发布成功' });
});

// 5. 获取项目/创意列表
app.get('/api/projects', (req, res) => {
  const { type = 'all' } = req.query;
  let projects = db.data.projects.filter(p => p.is_open === 1);
  
  // 按类型筛选
  if (type !== 'all') {
    projects = projects.filter(p => p.type === type);
  }

  // 关联用户信息，按时间倒序
  const result = projects.map(project => {
    const user = db.data.users.find(u => u.id === project.user_id);
    return {
      ...project,
      nickname: user?.nickname || '未知用户',
      user_contribution: user?.contribution || 0,
      user_id: user?.id
    };
  }).sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

  res.json(result);
});

// 6. 获取项目详情
app.get('/api/project/:id', (req, res) => {
  const { id } = req.params;
  const project = db.data.projects.find(p => p.id === Number(id));
  if (!project) return res.status(400).json({ msg: '项目不存在' });

  // 关联用户信息
  const user = db.data.users.find(u => u.id === project.user_id);
  res.json({
    ...project,
    nickname: user?.nickname || '未知用户',
    user_id: user?.id
  });
});

// 7. 提交协作贡献（bug修复/功能优化）
app.post('/api/contribution', auth, async (req, res) => {
  const { project_id, type, content, score = 5 } = req.body;
  
  const newContribution = {
    id: Date.now(),
    project_id: Number(project_id),
    user_id: req.user.id,
    type,
    content,
    status: 0, // 0待确认 1已确认
    score,
    create_time: new Date().toISOString()
  };

  db.data.contributions.push(newContribution);
  await db.write();

  res.json({ msg: '提交成功，等待作者确认' });
});

// 8. 确认贡献，增加贡献值
app.put('/api/contribution/:id/confirm', auth, async (req, res) => {
  const { id } = req.params;
  const contribution = db.data.contributions.find(c => c.id === Number(id));
  if (!contribution) return res.status(400).json({ msg: '记录不存在' });

  // 校验是否是项目作者
  const project = db.data.projects.find(p => p.id === contribution.project_id);
  if (!project || project.user_id !== req.user.id) {
    return res.status(403).json({ msg: '无权限操作' });
  }

  // 更新状态，增加贡献值
  contribution.status = 1;
  const contributeUser = db.data.users.find(u => u.id === contribution.user_id);
  contributeUser.contribution += contribution.score;
  await db.write();

  res.json({ msg: '已确认，贡献值已发放' });
});

// 9. AI辅助生成积木块（接入大模型API）
app.post('/api/ai/generate', auth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ msg: '请输入需求描述' });

  try {
    // 这里替换成你的大模型API Key，通义千问、豆包API都可以，免费额度足够
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return res.status(400).json({ msg: 'AI功能未配置，可先使用基础积木功能' });

    const response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      model: "qwen-turbo",
      input: {
        messages: [
          { role: "system", content: "你是一个低代码积木生成助手，用户输入需求，你只返回对应的积木配置JSON，格式为：[{id: string, type: string, label: string, config: object}]，可用type：button、text、input、modal，不要返回其他内容" },
          { role: "user", content: prompt }
        ]
      },
      parameters: { result_format: "message" }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data.output.choices[0].message.content;
    res.json({ blocks: JSON.parse(result) });
  } catch (err) {
    console.error('AI生成失败:', err);
    res.status(500).json({ msg: 'AI生成失败，请稍后重试' });
  }
});

// 10. 获取我提交的贡献记录
app.get('/api/contributions/mine', auth, (req, res) => {
  const myContributions = db.data.contributions
    .filter(c => c.user_id === req.user.id)
    .map(c => {
      const project = db.data.projects.find(p => p.id === c.project_id);
      return {
        ...c,
        project_title: project?.title || '项目已删除'
      };
    })
    .sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
  res.json(myContributions);
});

// 11. 获取某个项目收到的所有贡献记录
app.get('/api/contributions/project/:project_id', auth, (req, res) => {
  const { project_id } = req.params;
  const project = db.data.projects.find(p => p.id === Number(project_id));
  if (!project || project.user_id !== req.user.id) {
    return res.status(403).json({ msg: '无权查看' });
  }
  const list = db.data.contributions
    .filter(c => c.project_id === Number(project_id))
    .map(c => {
      const user = db.data.users.find(u => u.id === c.user_id);
      return { ...c, nickname: user?.nickname || '未知用户' };
    })
    .sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
  res.json(list);
});

// 12. 收藏项目
app.post('/api/collection/:project_id', auth, async (req, res) => {
  const project_id = Number(req.params.project_id);
  const project = db.data.projects.find(p => p.id === project_id);
  if (!project) return res.status(400).json({ msg: '项目不存在' });

  const exists = db.data.collections.find(
    c => c.user_id === req.user.id && c.project_id === project_id
  );
  if (exists) return res.status(400).json({ msg: '已收藏过该项目' });

  db.data.collections.push({
    id: Date.now(),
    user_id: req.user.id,
    project_id,
    create_time: new Date().toISOString()
  });
  await db.write();
  res.json({ msg: '收藏成功' });
});

// 13. 取消收藏
app.delete('/api/collection/:project_id', auth, async (req, res) => {
  const project_id = Number(req.params.project_id);
  const idx = db.data.collections.findIndex(
    c => c.user_id === req.user.id && c.project_id === project_id
  );
  if (idx === -1) return res.status(400).json({ msg: '未收藏该项目' });
  db.data.collections.splice(idx, 1);
  await db.write();
  res.json({ msg: '已取消收藏' });
});

// 14. 获取我的收藏列表
app.get('/api/collections/mine', auth, (req, res) => {
  const myCollections = db.data.collections
    .filter(c => c.user_id === req.user.id)
    .map(c => {
      const project = db.data.projects.find(p => p.id === c.project_id);
      const author = db.data.users.find(u => u.id === project?.user_id);
      return project ? {
        ...project,
        nickname: author?.nickname || '未知用户',
        user_contribution: author?.contribution || 0,
        collected_at: c.create_time
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.collected_at) - new Date(a.collected_at));
  res.json(myCollections);
});

// 15. 检查是否已收藏某项目
app.get('/api/collection/:project_id/status', auth, (req, res) => {
  const project_id = Number(req.params.project_id);
  const collected = !!db.data.collections.find(
    c => c.user_id === req.user.id && c.project_id === project_id
  );
  res.json({ collected });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`✅ 积木码后端服务已启动，端口：${PORT}`);
});