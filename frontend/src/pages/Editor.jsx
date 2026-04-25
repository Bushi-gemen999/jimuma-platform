// frontend/src/pages/Editor.jsx
import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ReactFlowProvider, ReactFlow, Background, Controls, Handle, Position,
  useNodesState, useEdgesState, addEdge, MarkerType, useReactFlow, Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Card, Button, Space, Drawer, Form, Input, message, Select, Radio,
  Row, Col, Divider, Modal, Tag, Tooltip, ColorPicker, InputNumber,
  Spin, Typography
} from 'antd';
import {
  SaveOutlined, BulbOutlined, CodeOutlined, PlusOutlined,
  RobotOutlined, SettingOutlined, DeleteOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Group: RadioGroup } = Radio;
const { Text } = Typography;

// ========================= 1. 节点颜色映射 =========================
const TYPE_COLOR = {
  button: '#1677ff',
  text: '#52c41a',
  input: '#fa8c16',
  select: '#722ed1',
  modal: '#eb2f96',
  form: '#13c2c2',
  image: '#faad14',
  divider: '#8c8c8c',
  card: '#2f54eb',
  custom: '#f5222d'
};

// ========================= 2. 自定义节点组件（左右连接） =========================
const CustomNode = ({ data, selected }) => {
  const color = TYPE_COLOR[data.type] || '#666';
  return (
    <div style={{
      padding: '10px 18px',
      border: selected ? `2px solid ${color}` : `1px solid ${color}44`,
      borderRadius: '10px',
      background: 'white',
      minWidth: '140px',
      boxShadow: selected ? `0 0 0 3px ${color}22` : '0 2px 8px rgba(0,0,0,0.08)',
      position: 'relative'
    }}>
      {/* 左侧 input handle */}
      <Handle type="target" position={Position.Left} style={{ background: color, width: 10, height: 10 }} />

      {/* 顶部类型标签 */}
      <div style={{
        fontSize: '10px',
        color: 'white',
        background: color,
        borderRadius: '4px',
        padding: '1px 6px',
        display: 'inline-block',
        marginBottom: '6px'
      }}>
        {data.typeLabel || data.type}
      </div>

      {/* 组件名称 */}
      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '13px' }}>{data.label}</div>

      {/* 配置摘要 */}
      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
        {data.type === 'text' && data.content && (
          <span>"{data.content.slice(0, 20)}{data.content.length > 20 ? '...' : ''}"</span>
        )}
        {data.type === 'button' && (
          <span>
            {data.variant || 'primary'} {data.disabled ? '· 禁用' : ''}
          </span>
        )}
        {data.type === 'input' && <span>占位：{data.placeholder || '请输入'}</span>}
        {data.type === 'select' && <span>{(data.options || []).length} 个选项</span>}
        {data.type === 'modal' && <span>弹窗：{data.modalTitle || '确认'}</span>}
        {data.type === 'form' && <span>{(data.fields || []).length} 个字段</span>}
        {data.type === 'image' && <span>{data.imageUrl ? '已设置图片' : '未设置图片'}</span>}
        {data.type === 'card' && <span>{data.cardTitle || '卡片标题'}</span>}
        {data.type === 'custom' && data.customDesc && <span>{data.customDesc.slice(0, 20)}</span>}
      </div>

      {/* 右侧 output handle */}
      <Handle type="source" position={Position.Right} style={{ background: color, width: 10, height: 10 }} />
    </div>
  );
};
const nodeTypes = { custom: CustomNode };

// ========================= 3. 预设积木类型 =========================
const BLOCK_TYPES = [
  { type: 'button',  label: '按钮',   icon: '🔘' },
  { type: 'text',    label: '文本',   icon: '📝' },
  { type: 'input',   label: '输入框', icon: '✏️' },
  { type: 'select',  label: '下拉框', icon: '🔽' },
  { type: 'modal',   label: '弹窗',   icon: '🪟' },
  { type: 'form',    label: '表单',   icon: '📋' },
  { type: 'image',   label: '图片',   icon: '🖼️' },
  { type: 'card',    label: '卡片',   icon: '🃏' },
  { type: 'divider', label: '分割线', icon: '➖' },
  { type: 'custom',  label: '自定义', icon: '⚙️' }
];

// ========================= 4. 节点配置抽屉 =========================
function NodeConfigDrawer({ node, visible, onClose, onSave }) {
  const [form] = Form.useForm();
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState([]);
  const [fields, setFields] = useState([]);
  const [fieldInput, setFieldInput] = useState({ label: '', type: 'text' });

  // 当 node 变化时，同步表单
  const openDrawer = useCallback(() => {
    if (!node) return;
    const d = node.data;
    form.setFieldsValue({
      label: d.label,
      content: d.content || '',
      variant: d.variant || 'primary',
      disabled: d.disabled ? 'yes' : 'no',
      placeholder: d.placeholder || '',
      modalTitle: d.modalTitle || '',
      imageUrl: d.imageUrl || '',
      cardTitle: d.cardTitle || '',
      customDesc: d.customDesc || '',
      bgColor: d.bgColor || '#ffffff',
      textColor: d.textColor || '#333333',
      borderRadius: d.borderRadius || 8
    });
    setOptions(d.options || []);
    setFields(d.fields || []);
  }, [node, form]);

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          编辑节点配置
          {node && (
            <Tag color={TYPE_COLOR[node.data?.type] || 'default'}>
              {node.data?.typeLabel || node.data?.type}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onClose={onClose}
      placement="right"
      width={440}
      afterOpenChange={open => { if (open) openDrawer(); }}
      footer={
        <Button type="primary" onClick={() => form.submit()} block>
          保存配置
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={values => {
          onSave({
            ...values,
            options,
            fields,
            disabled: values.disabled === 'yes'
          });
        }}
      >
        <Form.Item name="label" label="组件名称" rules={[{ required: true }]}>
          <Input placeholder="修改显示名称" />
        </Form.Item>

        {/* 按钮专属 */}
        {node?.data?.type === 'button' && (
          <>
            <Form.Item name="variant" label="按钮风格">
              <Select>
                <Option value="primary">主要（蓝色）</Option>
                <Option value="default">默认（白色）</Option>
                <Option value="dashed">虚线</Option>
                <Option value="text">文字按钮</Option>
                <Option value="link">链接按钮</Option>
              </Select>
            </Form.Item>
            <Form.Item name="disabled" label="是否禁用" initialValue="no">
              <RadioGroup>
                <Radio value="no">可用</Radio>
                <Radio value="yes">禁用</Radio>
              </RadioGroup>
            </Form.Item>
          </>
        )}

        {/* 文本专属 */}
        {node?.data?.type === 'text' && (
          <Form.Item name="content" label="文本内容">
            <TextArea rows={4} placeholder="输入文本内容" />
          </Form.Item>
        )}

        {/* 输入框专属 */}
        {node?.data?.type === 'input' && (
          <>
            <Form.Item name="placeholder" label="占位提示文字">
              <Input placeholder="请输入..." />
            </Form.Item>
            <Form.Item name="disabled" label="是否禁用" initialValue="no">
              <RadioGroup>
                <Radio value="no">可用</Radio>
                <Radio value="yes">禁用</Radio>
              </RadioGroup>
            </Form.Item>
          </>
        )}

        {/* 下拉框专属 */}
        {node?.data?.type === 'select' && (
          <Form.Item label="选项列表">
            <div style={{ marginBottom: '8px' }}>
              {options.map((opt, idx) => (
                <Tag
                  key={idx}
                  closable
                  onClose={() => setOptions(prev => prev.filter((_, i) => i !== idx))}
                  style={{ marginBottom: '4px' }}
                >
                  {opt}
                </Tag>
              ))}
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={optionInput}
                placeholder="输入选项后回车添加"
                onChange={e => setOptionInput(e.target.value)}
                onPressEnter={() => {
                  if (optionInput.trim()) {
                    setOptions(prev => [...prev, optionInput.trim()]);
                    setOptionInput('');
                  }
                }}
              />
              <Button onClick={() => {
                if (optionInput.trim()) {
                  setOptions(prev => [...prev, optionInput.trim()]);
                  setOptionInput('');
                }
              }}>添加</Button>
            </Space.Compact>
          </Form.Item>
        )}

        {/* 弹窗专属 */}
        {node?.data?.type === 'modal' && (
          <>
            <Form.Item name="modalTitle" label="弹窗标题">
              <Input placeholder="确认操作" />
            </Form.Item>
            <Form.Item name="content" label="弹窗内容">
              <TextArea rows={3} placeholder="弹窗正文描述" />
            </Form.Item>
          </>
        )}

        {/* 表单专属 */}
        {node?.data?.type === 'form' && (
          <Form.Item label="表单字段">
            <div style={{ marginBottom: '8px' }}>
              {fields.map((f, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '4px' }}>
                  <span>{f.label} <Text type="secondary">({f.type})</Text></span>
                  <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} onClick={() => setFields(prev => prev.filter((_, i) => i !== idx))} />
                </div>
              ))}
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={fieldInput.label}
                placeholder="字段名称"
                style={{ flex: 2 }}
                onChange={e => setFieldInput(prev => ({ ...prev, label: e.target.value }))}
              />
              <Select
                value={fieldInput.type}
                style={{ flex: 1 }}
                onChange={v => setFieldInput(prev => ({ ...prev, type: v }))}
              >
                <Option value="text">文本</Option>
                <Option value="number">数字</Option>
                <Option value="select">下拉</Option>
                <Option value="date">日期</Option>
                <Option value="textarea">多行文本</Option>
              </Select>
              <Button onClick={() => {
                if (fieldInput.label.trim()) {
                  setFields(prev => [...prev, { ...fieldInput }]);
                  setFieldInput({ label: '', type: 'text' });
                }
              }}>+</Button>
            </Space.Compact>
          </Form.Item>
        )}

        {/* 图片专属 */}
        {node?.data?.type === 'image' && (
          <Form.Item name="imageUrl" label="图片地址（URL）">
            <Input placeholder="https://example.com/image.png" />
          </Form.Item>
        )}

        {/* 卡片专属 */}
        {node?.data?.type === 'card' && (
          <>
            <Form.Item name="cardTitle" label="卡片标题">
              <Input placeholder="卡片标题" />
            </Form.Item>
            <Form.Item name="content" label="卡片内容">
              <TextArea rows={3} placeholder="卡片正文" />
            </Form.Item>
          </>
        )}

        {/* 自定义专属 */}
        {node?.data?.type === 'custom' && (
          <Form.Item name="customDesc" label="自定义描述（功能说明）">
            <TextArea rows={4} placeholder="描述这个自定义积木的功能、属性、行为…" />
          </Form.Item>
        )}

        {/* 通用样式配置 */}
        <Divider>外观样式（可选）</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="bgColor" label="背景色">
              <Input type="color" style={{ width: '100%', height: '36px', padding: '2px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="textColor" label="文字颜色">
              <Input type="color" style={{ width: '100%', height: '36px', padding: '2px' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="borderRadius" label="圆角大小">
              <InputNumber min={0} max={50} style={{ width: '100%' }} addonAfter="px" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}

// ========================= 5. 对齐辅助线组件 =========================
// 将画布坐标转为 DOM 坐标后，用 SVG 渲染辅助线
// 必须在 ReactFlow 内部使用（需要 useReactFlow hook）
function AlignGuideOverlay({ lines }) {
  const { getViewport } = useReactFlow();

  if (!lines || lines.length === 0) return null;

  const vp = getViewport(); // { x, y, zoom }

  // 画布坐标 → DOM 坐标
  const toDOM = (cx, cy) => ({
    x: cx * vp.zoom + vp.x,
    y: cy * vp.zoom + vp.y
  });

  return (
    <Panel position="top-left" style={{ margin: 0, padding: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 999
        }}
      >
        {lines.map((line, i) => {
          if (line.type === 'horizontal') {
            const p1 = toDOM(line.x1, line.y);
            const p2 = toDOM(line.x2, line.y);
            return (
              <g key={i}>
                <line
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke="#ff4d4f"
                  strokeWidth="1.5"
                  strokeDasharray="8 4"
                  opacity="0.9"
                />
                {/* 两端小圆点 */}
                <circle cx={p1.x} cy={p1.y} r="3" fill="#ff4d4f" opacity="0.9" />
                <circle cx={p2.x} cy={p2.y} r="3" fill="#ff4d4f" opacity="0.9" />
              </g>
            );
          } else {
            const p1 = toDOM(line.x, line.y1);
            const p2 = toDOM(line.x, line.y2);
            return (
              <g key={i}>
                <line
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke="#1677ff"
                  strokeWidth="1.5"
                  strokeDasharray="8 4"
                  opacity="0.9"
                />
                <circle cx={p1.x} cy={p1.y} r="3" fill="#1677ff" opacity="0.9" />
                <circle cx={p2.x} cy={p2.y} r="3" fill="#1677ff" opacity="0.9" />
              </g>
            );
          }
        })}
      </svg>
    </Panel>
  );
}

// ========================= 6. 可视化编辑器（左右连接 + 对齐辅助线） =========================
const VisualEditor = forwardRef(({ onAIGenerate }, ref) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'init_node',
      type: 'custom',
      data: { label: '开始节点', type: 'text', typeLabel: '文本', content: '这是起始内容' },
      position: { x: 80, y: 200 }
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 对齐辅助线状态（画布坐标系）
  const [alignLines, setAlignLines] = useState([]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getEditorData: () => ({ nodes, edges }),
    addNodes: (newNodes) => setNodes(prev => [...prev, ...newNodes])
  }));

  // 连线逻辑（左右连接）
  const onConnect = useCallback(
    (params) => {
      setEdges(prev => addEdge({
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1677ff' },
        style: { stroke: '#1677ff', strokeWidth: 2 }
      }, prev));
    },
    [setEdges]
  );

  // 节点点击事件
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setDrawerVisible(true);
  };

  // 保存节点配置
  const saveNodeConfig = (values) => {
    if (!selectedNode) return;
    setNodes(prev =>
      prev.map(node =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...values } }
          : node
      )
    );
    message.success('节点配置已保存');
    setDrawerVisible(false);
  };

  // 删除选中节点
  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
    setEdges(prev => prev.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setDrawerVisible(false);
    setSelectedNode(null);
    message.info('节点已删除');
  };

  // 添加节点
  const addBlock = (blockType) => {
    const block = BLOCK_TYPES.find(b => b.type === blockType);
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 80, y: Math.random() * 300 + 80 },
      data: {
        label: block.label,
        type: block.type,
        typeLabel: block.label,
        content: '',
        options: [],
        fields: [],
        disabled: false
      }
    };
    setNodes(prev => [...prev, newNode]);
  };

  // ---- 对齐辅助线核心逻辑 ----
  const SNAP_THRESHOLD = 8; // 磁吸阈值（画布坐标px）
  const NODE_W = 160;       // 节点近似宽度
  const NODE_H = 80;        // 节点近似高度

  const onNodeDrag = useCallback((event, draggedNode) => {
    const dx = draggedNode.position.x;
    const dy = draggedNode.position.y;
    // 被拖动节点的中心
    const dCx = dx + NODE_W / 2;
    const dCy = dy + NODE_H / 2;

    const lines = [];
    let snapX = null;
    let snapY = null;

    setNodes(prev => {
      prev.forEach(n => {
        if (n.id === draggedNode.id) return;
        const nx = n.position.x;
        const ny = n.position.y;
        const nCx = nx + NODE_W / 2;
        const nCy = ny + NODE_H / 2;

        // 水平对齐检测（顶边、中线、底边）
        const hChecks = [
          { dragY: dy,                  targetY: ny,                  label: 'top-top' },
          { dragY: dy,                  targetY: nCy - NODE_H / 2,    label: 'top-mid' },
          { dragY: dCy - NODE_H / 2,   targetY: nCy - NODE_H / 2,   label: 'mid-mid' },
          { dragY: dy + NODE_H,         targetY: ny + NODE_H,         label: 'bot-bot' },
        ];
        hChecks.forEach(({ dragY, targetY }) => {
          if (Math.abs(dragY - targetY) < SNAP_THRESHOLD) {
            if (snapY === null) snapY = targetY - (dragY - dy);
            const minX = Math.min(dx, nx) - 20;
            const maxX = Math.max(dx + NODE_W, nx + NODE_W) + 20;
            lines.push({ type: 'horizontal', y: targetY, x1: minX, x2: maxX });
          }
        });

        // 垂直对齐检测（左边、中线、右边）
        const vChecks = [
          { dragX: dx,                  targetX: nx },
          { dragX: dCx - NODE_W / 2,   targetX: nCx - NODE_W / 2 },
          { dragX: dx + NODE_W,         targetX: nx + NODE_W },
        ];
        vChecks.forEach(({ dragX, targetX }) => {
          if (Math.abs(dragX - targetX) < SNAP_THRESHOLD) {
            if (snapX === null) snapX = targetX - (dragX - dx);
            const minY = Math.min(dy, ny) - 20;
            const maxY = Math.max(dy + NODE_H, ny + NODE_H) + 20;
            lines.push({ type: 'vertical', x: targetX, y1: minY, y2: maxY });
          }
        });
      });

      // 磁吸：更新被拖节点位置
      if (snapX !== null || snapY !== null) {
        return prev.map(n =>
          n.id === draggedNode.id
            ? {
                ...n,
                position: {
                  x: snapX !== null ? snapX : n.position.x,
                  y: snapY !== null ? snapY : n.position.y
                }
              }
            : n
        );
      }
      return prev;
    });

    setAlignLines(lines);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setAlignLines([]);
  }, []);

  // 将画布坐标转为 DOM 像素（供 SVG 覆盖层使用）
  // ReactFlow 内置 Background 已处于画布坐标系，我们把辅助线也放入 ReactFlow 内部
  // 通过自定义 SVG overlay 嵌入 ReactFlow 子节点

  return (
    <div>
      {/* 积木库工具栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginRight: '4px' }}>积木库：</span>
          {BLOCK_TYPES.map(block => (
            <Tooltip key={block.type} title={`添加${block.label}组件`}>
              <Button
                size="small"
                type="dashed"
                style={{ borderColor: TYPE_COLOR[block.type] + '88', color: TYPE_COLOR[block.type] }}
                onClick={() => addBlock(block.type)}
              >
                {block.icon} {block.label}
              </Button>
            </Tooltip>
          ))}
          <Divider type="vertical" />
          <Button
            size="small"
            type="primary"
            icon={<RobotOutlined />}
            onClick={onAIGenerate}
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none' }}
          >
            AI 生成积木
          </Button>
        </div>
      </Card>

      {/* 画布区域（左右连接 + 对齐辅助线） */}
      <Card
        title={
          <span>
            <CodeOutlined /> 可视化编辑器（节点从左向右连接）
            <span style={{ marginLeft: '12px', fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
              拖动节点时自动显示对齐辅助线并磁吸
            </span>
          </span>
        }
        style={{ height: '560px' }}
        styles={{ body: { padding: 0, height: 'calc(100% - 57px)' } }}
      >
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', background: '#fafafa', position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            fitView
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2 }
            }}
          >
            <Background color="#ddd" gap={16} />
            <Controls />
            {/* 对齐辅助线：嵌入 ReactFlow 内部，使用画布坐标系 */}
            <AlignGuideOverlay lines={alignLines} />
          </ReactFlow>
        </div>
      </Card>

      {/* 节点配置抽屉 */}
      <NodeConfigDrawer
        node={selectedNode}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSave={saveNodeConfig}
      />

      {/* 删除节点按钮（悬浮在右下角，选中节点时出现） */}
      {drawerVisible && selectedNode && (
        <div style={{ position: 'fixed', bottom: '80px', right: '460px', zIndex: 1000 }}>
          <Button danger icon={<DeleteOutlined />} onClick={deleteSelected}>
            删除该节点
          </Button>
        </div>
      )}
    </div>
  );
});

// ========================= 6. AI 生成积木弹窗 =========================
function AIGenerateModal({ visible, onClose, onAdd }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入需求描述');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/ai/generate', { prompt: prompt.trim() });
      setResult(res.data.blocks);
    } catch (err) {
      message.error(err.response?.data?.msg || 'AI 生成失败，请检查 AI_API_KEY 配置');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCanvas = () => {
    if (!result || result.length === 0) return;
    const newNodes = result.map((block, idx) => ({
      id: `ai_node_${Date.now()}_${idx}`,
      type: 'custom',
      position: { x: 100 + idx * 200, y: 100 + idx * 80 },
      data: {
        label: block.label || block.type,
        type: block.type || 'custom',
        typeLabel: block.label || 'AI生成',
        ...block.config,
        options: block.config?.options || [],
        fields: block.config?.fields || []
      }
    }));
    onAdd(newNodes);
    message.success(`已将 ${newNodes.length} 个 AI 积木添加到画布`);
    setResult(null);
    setPrompt('');
    onClose();
  };

  return (
    <Modal
      title={<span><RobotOutlined style={{ color: '#764ba2' }} /> AI 生成积木</span>}
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      <div style={{ marginBottom: '16px', padding: '12px', background: '#f9f0ff', borderRadius: '8px', fontSize: '13px', color: '#722ed1' }}>
        💡 描述你需要的 UI 组件，AI 会自动生成对应的积木节点并添加到画布中
      </div>
      <Form layout="vertical">
        <Form.Item label="需求描述">
          <TextArea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="例如：我需要一个用户登录表单，包含用户名输入框、密码输入框和登录按钮"
          />
        </Form.Item>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          loading={loading}
          onClick={handleGenerate}
          style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none' }}
          block
        >
          {loading ? '生成中...' : '开始生成'}
        </Button>
      </Form>

      {loading && (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin tip="AI 正在生成积木配置..." />
        </div>
      )}

      {result && (
        <div style={{ marginTop: '16px' }}>
          <Divider>生成结果（{result.length} 个积木）</Divider>
          {result.map((block, idx) => (
            <div key={idx} style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Tag color={TYPE_COLOR[block.type] || 'default'}>{block.type}</Tag>
                <strong>{block.label}</strong>
                {block.config && (
                  <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                    {JSON.stringify(block.config).slice(0, 60)}
                  </Text>
                )}
              </div>
            </div>
          ))}
          <Button type="primary" onClick={handleAddToCanvas} block style={{ marginTop: '8px' }}>
            <PlusOutlined /> 全部添加到画布
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ========================= 7. 主编辑器组件 =========================
function EditorContent({ user }) {
  const [mode, setMode] = useState('visual');
  const [loading, setLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [projectForm] = Form.useForm();
  const visualEditorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 表单提交
  const onFormFinish = async (values) => {
    if (!values.title?.trim()) { message.error('请填写项目标题'); return; }
    if (!values.description?.trim()) { message.error('请填写项目简介'); return; }

    if (mode === 'visual') {
      const editorData = visualEditorRef.current?.getEditorData();
      if (!editorData?.nodes || editorData.nodes.length === 0) {
        message.error('请至少添加一个积木节点');
        return;
      }
    }

    if (mode === 'idea' && !values.ideaContent?.trim()) {
      message.error('请填写详细的创意内容');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: values.title.trim(),
        description: values.description.trim(),
        type: values.type || (mode === 'idea' ? 'idea' : 'component'),
        content: mode === 'visual'
          ? JSON.stringify(visualEditorRef.current?.getEditorData())
          : JSON.stringify({ text: values.ideaContent.trim(), blocks: [] })
      };
      await axios.post('/api/project', submitData);
      message.success('发布成功！');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.msg || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const onModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    projectForm.setFieldsValue({ type: newMode === 'idea' ? 'idea' : 'component' });
  };

  return (
    <ReactFlowProvider>
      <div>
        {/* 顶部：模式切换+发布 */}
        <Card style={{ marginBottom: '20px' }}>
          <Row gutter={20} align="middle">
            <Col span={14}>
              <Space>
                <span style={{ fontWeight: 'bold' }}>发布模式：</span>
                <RadioGroup value={mode} onChange={onModeChange} buttonStyle="solid">
                  <Radio.Button value="visual"><CodeOutlined /> 可视化编辑器</Radio.Button>
                  <Radio.Button value="idea"><BulbOutlined /> 纯文字创意</Radio.Button>
                </RadioGroup>
              </Space>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={() => projectForm.submit()}
              >
                发布项目
              </Button>
            </Col>
          </Row>

          <Divider />

          <Form form={projectForm} layout="vertical" onFinish={onFormFinish} initialValues={{ type: 'component' }}>
            <Row gutter={20}>
              <Col span={8}>
                <Form.Item name="title" label="项目标题" rules={[{ required: true, message: '请填写项目标题' }]}>
                  <Input placeholder="给你的项目起个名字" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="type" label="项目类型">
                  <Select>
                    <Option value="component">组件</Option>
                    <Option value="page">页面</Option>
                    <Option value="game">小游戏</Option>
                    <Option value="idea">纯文字创意</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="description" label="项目简介" rules={[{ required: true, message: '请填写项目简介' }]}>
                  <Input placeholder="简单介绍一下你的项目" />
                </Form.Item>
              </Col>
            </Row>

            {mode === 'idea' && (
              <Form.Item name="ideaContent" label="详细创意内容" rules={[{ required: true, message: '请填写创意内容' }]}>
                <TextArea rows={8} placeholder={'在这里详细描述你的创意：\n1. 你想做什么功能？\n2. 它有什么特点？\n3. 你希望怎么实现？'} />
              </Form.Item>
            )}
          </Form>
        </Card>

        {/* 可视化编辑器或纯文字区 */}
        {mode === 'visual' ? (
          <VisualEditor
            ref={visualEditorRef}
            onAIGenerate={() => setAiModalVisible(true)}
          />
        ) : (
          <Card title="纯文字创意编辑区" style={{ minHeight: '400px' }}>
            <div style={{ textAlign: 'center', color: '#999', padding: '60px' }}>
              <BulbOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#faad14' }} />
              <div>已切换到「纯文字创意」模式，在上方填写详细创意内容后点击发布即可</div>
            </div>
          </Card>
        )}

        {/* AI 生成积木弹窗 */}
        <AIGenerateModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
          onAdd={(nodes) => visualEditorRef.current?.addNodes(nodes)}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default function Editor({ user }) {
  return <EditorContent user={user} />;
}
