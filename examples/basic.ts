/**
 * 基础使用示例
 *
 * 事件消费方式: agent.subscribe() 订阅类型化事件（对齐 pi-agent-core Agent.subscribe）
 */

import { Agent } from "../src/index.js";

async function main() {
  const agent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    workspaceDir: process.cwd(),
  });

  const sessionId = "example-basic";

  console.log("Mini Agent 基础示例\n");

  // 订阅事件（流式文本 + 工具调用）
  const unsubscribe = agent.subscribe((event) => {
    switch (event.type) {
      case "message_delta":
        process.stdout.write(event.delta);
        break;
      case "tool_execution_start":
        console.log(`\n[调用工具: ${event.toolName}]`);
        break;
    }
  });

  // 示例 1: 简单对话
  console.log("--- 示例 1: 列出文件 ---");
  const result1 = await agent.run(sessionId, "列出当前目录的文件");
  console.log(`\n完成: ${result1.turns} 轮, ${result1.toolCalls} 次工具调用\n`);

  // 示例 2: 代码操作
  console.log("--- 示例 2: 读取 package.json ---");
  const result2 = await agent.run(sessionId, "读取 package.json 并告诉我项目名称");
  console.log(`\n完成: ${result2.turns} 轮\n`);

  // 清理
  unsubscribe();
  await agent.reset(sessionId);
}

main().catch(console.error);
