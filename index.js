import dotenv from "dotenv";
dotenv.config();

import readline from "readline/promises";

import { ChatGroq } from "@langchain/groq";

import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { TavilySearch } from "@langchain/tavily";


// TOOL SETUP


const searchTool = new TavilySearch({
  maxResults: 3,
  topic: "general",
  apiKey: process.env.TAVILY_API_KEY,
});

const toolNode = new ToolNode([searchTool]);


// LLM SETUP


const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxRetries: 2,
  apiKey: process.env.GROQ_API_KEY,
}).bindTools([searchTool]);


// MODEL NODE


async function callModel(state) {
  console.log("\nCalling model...\n");

  const response = await llm.invoke([
    new SystemMessage(`
You are a helpful AI assistant.

Rules:
- Use tools whenever live/current information is needed.
- Never return raw JSON.
- Summarize tool results naturally.
- Keep answers readable and concise.
- Format answers properly.
`),

    ...state.messages,
  ]);

  return {
    messages: [response],
  };
}


// GRAPH


const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)

  .addNode("tools", toolNode)

  .addEdge("__start__", "agent")

  .addConditionalEdges("agent", toolsCondition)

  .addEdge("tools", "agent");

// compile graph
const app = workflow.compile();


async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const userInp = await rl.question("\nYou: ");

    if (userInp.toLowerCase() === "exit") {
      console.log("\nGoodbye 👋");
      break;
    }

    const finalState = await app.invoke({
      messages: [new HumanMessage(userInp)],
    });

    // get latest AI message
    const aiMessages = finalState.messages.filter(
      (msg) => msg.constructor.name === "AIMessage",
    );

    const lastAIMessage = aiMessages[aiMessages.length - 1];

    console.log("\nAI:", lastAIMessage.content);
  }

  rl.close();
}

main();
