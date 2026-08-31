import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type AgentSource = {
  id: string;
  title: string;
  excerpt: string;
};

const KNOWLEDGE_PATH = path.join(process.cwd(), "knowledge");
const FORTY_TWO_SOURCE_PATH = path.join(KNOWLEDGE_PATH, "work-experience-01.md");
const SOURCE_PATH = path.join(KNOWLEDGE_PATH, "work-experience-02.md");
const XTRACE_SOURCE_PATH = path.join(KNOWLEDGE_PATH, "work-experience-03.md");

export async function getKnowledgeContext() {
  const files = (await readdir(KNOWLEDGE_PATH))
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .sort();
  const documents = await Promise.all(
    files.map(async (file) => `\n<!-- source: ${file} -->\n${await readFile(path.join(KNOWLEDGE_PATH, file), "utf8")}`),
  );
  return documents.join("\n\n");
}

const TOPICS = [
  "第二段", "第二次", "creatorone", "tiktok", "达人", "营销", "agent", "架构",
  "技术栈", "难点", "不足", "优化", "bullmq", "项目", "工作经历",
];

const PERSONAL_TOPICS = [
  "你是谁", "介绍自己", "关于你", "名字", "叫什", "ender",
  "哪里人", "住哪", "居住", "家乡", "成都", "南充",
  "出生", "生日", "年龄", "几岁", "八字", "星座", "白羊", "mbti", "intj",
  "身高", "体重", "发型", "长发", "穿搭", "clean fit", "cleanfit", "山本耀司", "日系",
  "游戏", "minecraft", "rimworld", "暗黑地牢", "游戏王",
  "文学", "读书", "书", "写作", "随笔", "江户川乱步", "陀思妥耶夫斯基", "尼采", "地下室手记", "查拉图斯特拉",
  "音乐", "摇滚", "爵士", "乐队", "周二下午谁没来", "水仙斗活佛", "sons of 1973", "七七连环杀人调", "第四章第三曲", "逝水流年调",
  "开源", "react bits", "reactbits", "贡献者", "开发组合", "开发工具", "herdr", "pi coding", "deepseek", "codex",
  "who are you", "about you", "your name", "where are you from", "where do you live",
  "birthday", "born", "age", "zodiac", "height", "weight", "hair", "fashion", "style",
  "game", "book", "literature", "writing", "music", "rock", "jazz", "band", "open source", "developer tools",
];

export function isSecondExperienceQuestion(question: string) {
  const normalized = question.toLowerCase();
  return TOPICS.some((topic) => normalized.includes(topic));
}

export function isFortyTwoQuestion(question: string) {
  const normalized = question.toLowerCase();
  return ["42.ai", "42ai", "42 agent", "42-agent", "agent desktop", "agent runtime", "多 agent 工作台"].some(
    (topic) => normalized.includes(topic),
  );
}

export function isXTraceQuestion(question: string) {
  const normalized = question.toLowerCase();
  return ["xtrace", "xtace", "ai memory", "memory hub", "浏览器插件", "browser extension", "mcp"].some(
    (topic) => normalized.includes(topic),
  );
}

export function isKnownQuestion(question: string) {
  const normalized = question.toLowerCase();
  return isFortyTwoQuestion(normalized) || isSecondExperienceQuestion(normalized) || isXTraceQuestion(normalized) || PERSONAL_TOPICS.some((topic) => normalized.includes(topic));
}

function section(markdown: string, heading: string) {
  const marker = `# ${heading}`;
  const start = markdown.indexOf(marker);
  if (start < 0) return "";
  const bodyStart = start + marker.length;
  const next = markdown.indexOf("\n# ", bodyStart);
  return markdown.slice(bodyStart, next < 0 ? undefined : next).trim();
}

function compact(value: string) {
  return value.replace(/^\d+\.\s+/gm, "").replace(/^-\s+/gm, "").replace(/\n{2,}/g, "\n").trim();
}

export async function answerFortyTwoFromKnowledge(question: string) {
  const markdown = await readFile(FORTY_TWO_SOURCE_PATH, "utf8");
  const normalized = question.toLowerCase();
  let headings = ["公司与方向", "我的角色", "核心工作", "技术与架构亮点"];
  let lead = "我在 42.ai 负责从 0 到 1 构建 AI Native 团队的 Agent 工作流。";

  if (/简短|概括|介绍|一分钟|1分钟/.test(normalized)) {
    headings = ["面试时的简短版本"];
    lead = "简单说：";
  } else if (/架构|runtime|acp|mcp|技术|设计/.test(normalized)) {
    headings = ["核心工作", "技术与架构亮点"];
    lead = "这套系统分成 Agent 执行底座、产品级编排和团队协作服务三层。";
  }

  const selected = headings.map((heading) => ({ heading, body: compact(section(markdown, heading)) }));
  const answer = `${lead}\n\n${selected.map(({ body }) => body).join("\n\n")}`;
  const sources: AgentSource[] = selected.map(({ heading, body }) => ({
    id: `work-experience-01-${heading}`,
    title: `42.ai 工作经历 · ${heading}`,
    excerpt: body.slice(0, 118) + (body.length > 118 ? "…" : ""),
  }));

  return { answer, sources };
}

export async function answerFromKnowledge(question: string) {
  const markdown = await readFile(SOURCE_PATH, "utf8");
  const normalized = question.toLowerCase();
  let headings = ["项目概述", "我的工作", "三个核心亮点"];
  let lead = "我的第二段工作经历是在 Creatorone 参与一款面向 TikTok Shop 商家的 AI 达人营销 SaaS。";

  if (/一分钟|1分钟|介绍|概括|讲讲/.test(normalized)) {
    headings = ["面试时的 1 分钟版本", "我的工作"];
    lead = "我会先介绍 Creatorone 做什么，再讲我参与的部分：";
  } else if (/难点|挑战|困难|可靠/.test(normalized)) {
    headings = ["项目难点"];
    lead = "这个项目最难的不是接入模型，而是控制 Agent 的边界与执行可靠性。";
  } else if (/不足|优化|改进|下一步/.test(normalized)) {
    headings = ["不足与下一步"];
    lead = "我认为它下一阶段最值得投入的是可靠性、安全性和可观测性的工程化。";
  } else if (/架构|技术栈|技术|设计/.test(normalized)) {
    headings = ["技术架构", "三个核心亮点"];
    lead = "架构的关键原则是：Agent 负责推理和动作选择，业务服务负责真实数据与确定性规则。";
  } else if (/链路|触达|流程|bullmq|队列/.test(normalized)) {
    headings = ["核心业务链路：达人营销自动化"];
    lead = "最能体现系统设计的一条链路，是达人营销自动化：";
  }

  const selected = headings.map((heading) => ({ heading, body: compact(section(markdown, heading)) }));
  const answer = `${lead}\n\n${selected.map(({ body }) => body).join("\n\n")}`;
  const sources: AgentSource[] = selected.map(({ heading, body }) => ({
    id: `work-experience-02-${heading}`,
    title: `第二段工作经历 · ${heading}`,
    excerpt: body.slice(0, 118) + (body.length > 118 ? "…" : ""),
  }));

  return { answer, sources };
}

export async function answerXTraceFromKnowledge(question: string) {
  const markdown = await readFile(XTRACE_SOURCE_PATH, "utf8");
  const normalized = question.toLowerCase();
  let headings = ["公司与产品", "我的角色", "产品形态", "我的工作"];
  let lead = "我在 XTrace 担任前端开发实习生，参与了公司整套跨 Agent Memory 产品的建设。";

  if (/介绍|概括|讲讲|简短|一分钟|1分钟/.test(normalized)) {
    headings = ["简短介绍"];
    lead = "简单说：";
  } else if (/做了什么|负责|工作|职责|前端|ux|界面/.test(normalized)) {
    headings = ["公司与产品", "产品形态", "我的工作"];
    lead = "我参与的是 XTrace 想做的整套事情，不只是单独的 Web 页面。";
  } else if (/mcp|插件|memory hub|共享|产品|怎么/.test(normalized)) {
    headings = ["公司与产品", "产品形态"];
    lead = "XTrace 通过不同入口，让 Memory 能在多个 AI Agent 之间共享。";
  }

  const selected = headings.map((heading) => ({ heading, body: compact(section(markdown, heading)) }));
  const answer = `${lead}\n\n${selected.map(({ body }) => body).join("\n\n")}`;
  const sources: AgentSource[] = selected.map(({ heading, body }) => ({
    id: `work-experience-03-${heading}`,
    title: `XTrace 工作经历 · ${heading}`,
    excerpt: body.slice(0, 118) + (body.length > 118 ? "…" : ""),
  }));

  return { answer, sources };
}
