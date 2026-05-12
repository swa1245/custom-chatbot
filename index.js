import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "langchain";
import readline from "readline/promises";

// step 1 define node fucntions
// step 2 build the graph
// 3 complie and invoke the graph

function callModel(state) {
  // call the llm using apis
  console.log("Calling the model with messages: ");
  return state;
}

// build the graph
const workFlow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");


// compile and invoke the graph

const app = workFlow.compile();


async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const userInp = await rl.question("What is your name? ");
    // invoke the graph
    const finalState = await app.invoke({
      messages : [{role:'user', content: userInp}]
    });
    console.log(finalState);
  }
  rl.close();
}
main();
