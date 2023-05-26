import { test, expect } from "@jest/globals";

import { deserialize } from "../serde.js";
import { OpenAI } from "../../llms/openai.js";
import { PromptTemplate } from "../../prompts/prompt.js";
import { LLMChain } from "../../chains/llm_chain.js";

test("serialize + deserialize llm", async () => {
  const llm = new OpenAI({ temperature: 0.5, modelName: "davinci" });
  const str = JSON.stringify(llm, null, 2);
  expect(str).toMatchInlineSnapshot(`
    "{
      "v": 1,
      "type": "constructor",
      "identifier": [
        "langchain",
        "llms",
        "openai",
        "OpenAI"
      ],
      "arguments": [
        {
          "temperature": 0.5,
          "modelName": "davinci"
        }
      ]
    }"
  `);
  const llm2 = await deserialize<OpenAI>(str);
  expect(llm2).toBeInstanceOf(OpenAI);
  expect(JSON.stringify(llm2, null, 2)).toBe(str);
});

test("serialize + deserialize llm chain", async () => {
  const llm = new OpenAI({ temperature: 0.5, modelName: "davinci" });
  const prompt = PromptTemplate.fromTemplate("Hello, {name}!");
  const chain = new LLMChain({ llm, prompt });
  const str = JSON.stringify(chain, null, 2);
  expect(str).toMatchInlineSnapshot(`
    "{
      "v": 1,
      "type": "constructor",
      "identifier": [
        "langchain",
        "chains",
        "llm_chain",
        "LLMChain"
      ],
      "arguments": [
        {
          "llm": {
            "v": 1,
            "type": "constructor",
            "identifier": [
              "langchain",
              "llms",
              "openai",
              "OpenAI"
            ],
            "arguments": [
              {
                "temperature": 0.5,
                "modelName": "davinci"
              }
            ]
          },
          "prompt": {
            "v": 1,
            "type": "constructor",
            "identifier": [
              "langchain",
              "prompts",
              "prompt",
              "PromptTemplate"
            ],
            "arguments": [
              {
                "inputVariables": [
                  "name"
                ],
                "templateFormat": "f-string",
                "template": "Hello, {name}!"
              }
            ]
          }
        }
      ]
    }"
  `);
  const chain2 = await deserialize<LLMChain>(str);
  expect(chain2).toBeInstanceOf(LLMChain);
  expect(JSON.stringify(chain2, null, 2)).toBe(str);
});
