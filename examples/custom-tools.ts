/**
 * 自定义工具示例
 *
 * 事件消费方式: agent.subscribe() 订阅类型化事件（对齐 pi-agent-core Agent.subscribe）
 */

import { Agent, builtinTools, type Tool } from "../src/index.js";

// 自定义工具: 获取当前时间
const timeTool: Tool<{ timezone?: string }> = {
  name: "get_time",
  description: "获取当前时间",
  inputSchema: {
    type: "object",
    properties: {
      timezone: { type: "string", description: "时区，如 Asia/Shanghai" },
    },
  },
  async execute(input) {
    const tz = input.timezone ?? "Asia/Shanghai";
    const now = new Date().toLocaleString("zh-CN", { timeZone: tz });
    return `当前时间 (${tz}): ${now}`;
  },
};

// 自定义工具: 计算器
const calcTool: Tool<{ expression: string }> = {
  name: "calculate",
  description: "计算数学表达式",
  inputSchema: {
    type: "object",
    properties: {
      expression: { type: "string", description: "数学表达式，如 2 + 3 * 4" },
    },
    required: ["expression"],
  },
  async execute(input) {
    try {
      // 简单安全检查
      if (!/^[\d\s+\-*/().]+$/.test(input.expression)) {
        return "错误: 不支持的表达式";
      }
      const result = Function(`"use strict"; return (${input.expression})`)();
      return `${input.expression} = ${result}`;
    } catch (err) {
      return `计算错误: ${(err as Error).message}`;
    }
  },
};

async function main() {
  const agent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    // 组合内置工具和自定义工具
    tools: [...builtinTools, timeTool, calcTool],
    systemPrompt: `你是一个助手，可以使用以下工具：
- read/write/edit: 文件操作
- exec: 执行命令
- get_time: 获取时间
- calculate: 计算数学表达式

请帮助用户完成任务。`,
  });

  console.log("自定义工具示例\n");

  // 订阅事件（流式文本 + 工具调用详情）
  const unsubscribe = agent.subscribe((event) => {
    switch (event.type) {
      case "message_delta":
        process.stdout.write(event.delta);
        break;
      case "tool_execution_start":
        console.log(`\n[${event.toolName}]`, event.args);
        break;
      case "tool_execution_end":
        console.log(`  → ${event.result}`);
        break;
    }
  });

  const result = await agent.run(
    "custom-tools",
    "现在几点了？另外帮我算一下 (15 + 27) * 3 等于多少",
  );

  console.log(`\n\n完成: ${result.turns} 轮, ${result.toolCalls} 次工具调用`);

  unsubscribe();
}

main().catch(console.error);
