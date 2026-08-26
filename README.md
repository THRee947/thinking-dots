# thinking-dots

SigVoid 黑洞风格的 Agent 状态动画。项目使用 React + Canvas 绘制，包含产品 Logo、黑白粒子和黑洞形变动画。

## 本地运行

```bash
npm install
npm run dev
```

启动后打开终端显示的本地地址即可查看预览。

## 构建检查

```bash
npm run typecheck
npm run build:demo
```

## 当前状态

- `working`：Logo 呼吸形变动画
- `searching`：Logo 与快速吸附粒子动画
- `solving`：Logo warp 形变、星点吸入和连续循环
- `thinking`：原版思考轨道动画
- `listening`：原版监听动画
- `connecting`：原版连接动画
- `planning`：原版规划动画
- `shaping`：原版塑形动画

## 项目结构

- `src/ThinkingOrb.tsx`：Canvas 动画和状态绘制逻辑
- `src/presets.ts`：状态与动画预设映射
- `src/engine/`：动画引擎及黑洞绘制逻辑
- `public/`：SigVoid Logo SVG 素材
- `demo/`：本地预览页面

## 说明

这是 SigVoid 产品视觉探索版本。后续如果需要交给开发接入，可以直接复用 `ThinkingOrb` 组件，并通过 `state`、`size`、`speed` 和 `paused` 控制动画。
