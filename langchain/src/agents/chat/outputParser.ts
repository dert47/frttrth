import { AgentActionOutputParser } from "../types.js";
import { AgentFinish } from "../../schema/index.js";
import { FORMAT_INSTRUCTIONS } from "./prompt.js";

export const FINAL_ANSWER_ACTION = "Final Answer:";
export class ChatAgentOutputParser extends AgentActionOutputParser {
  lc_namespace = ["langchain", "agents", "chat"];

  async parse(text: string) {
    if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
      const parts = text.split(FINAL_ANSWER_ACTION);
      const output = parts[parts.length - 1].trim();
      return { returnValues: { output }, log: text } satisfies AgentFinish;
    }

    const action = text.includes("```")
      ? text.trim().split(/```(?:json)?/)[1]
      : text.trim();
    try {
      const response = JSON.parse(action.trim());
      return {
        tool: response.action,
        toolInput: response.action_input,
        log: text,
      };
    } catch {
      throw new Error(
        `Unable to parse JSON response from chat agent.\n\n${text}`
      );
    }
  }

  getFormatInstructions(): string {
    return FORMAT_INSTRUCTIONS;
  }
}
