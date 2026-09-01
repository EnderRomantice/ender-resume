---
id: work-experience-01
title: 42.ai 工作经历
company: 42.ai
period: 2026.08-至今
topics: AI Native, Agent Runtime, ACP, MCP, Multi-Agent, Electron, AI Hardware, Accessibility
---

# 公司与方向

42.ai 是一家聚焦视障辅助、宠物智能与阿尔茨海默照护赛道的 AI 硬件初创公司。我的工作重点是为 AI Native 团队构建可复用的 Agent 研发与协作基础设施，并将其落到真实的团队工作流和产品中。

# 我的角色

我担任软件技术 Leader，从 0 到 1 构建团队的 Agent 工作流，并负责软件技术方向与工程落地。工作覆盖 `/Users/code/42-club` 下的项目：单 Agent 执行底座、多 Agent 桌面工作台、团队协作后端、AI 招聘系统、公司官网与申请流程，以及社群活动平台。

# 核心工作

- 设计并实现 `42-agent`：一个可嵌入的 TypeScript Agent Runtime，支持模型与工具循环、Skills、MCP、ACP、流式事件、多会话并发、持久化、取消、故障恢复和安全审批。
- 开发 `42-agent-desktop`：基于 Electron 的多 Agent Workbench，支持根 Agent 与子 Agent、任务委派、MCP 工具管理、Bash 审批、独立会话存储和团队聊天。
- 建设 `42-agent-service`：以 NestJS、PostgreSQL / Supabase 为基础，提供账号认证、组织与角色、好友与消息、Agent 管理、模型凭据和 Model Gateway 等协作能力。
- 开发 `42-admin` AI 招聘系统：实现候选人申请、简历解析与评分、语义搜索、对话式 Recruiting Agent、会话持久化、标签与筛选等流程。
- 交付 `42` 公司官网及申请流程、`42-meeting` 社群活动平台，覆盖视觉体验、响应式设计、无障碍、后台管理和部署。

# 技术与架构亮点

- 将 Agent 执行核心与产品级编排分层：Runtime 负责确定性的生命周期与持久化，Desktop / 业务系统负责任务拆解、协作策略和 UI。
- 通过 ACP 连接编排层与独立 Agent，通过 MCP 接入外部工具，并在主进程、服务端权限和显式审批之间建立安全边界。
- 同一 Agent 内按 FIFO 保证执行顺序，不同 Agent / Session 可并发；在模型和工具边界持久化检查点，保守处理崩溃后的外部副作用。
- 把 Agent 能力用于真实团队流程，包括软件研发、候选人筛选与搜索、组织协作和运营工具，而不是停留在文本生成或单轮 Demo。

# 面试时的简短版本

我在 42.ai 负责从 0 到 1 构建 AI Native 团队的 Agent 工作流。底层做了支持 ACP、MCP、Skills、持久化和故障恢复的 TypeScript Agent Runtime；上层做了 Electron 多 Agent 工作台以及账号、组织、消息和模型网关服务；同时把这套能力落到 AI 招聘、团队协作和公司运营产品中。我的工作既包含 Agent 架构，也覆盖桌面端、前后端和产品交付。
