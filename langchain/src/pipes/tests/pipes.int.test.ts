import { OpenAI } from "../../llms/openai.js";
import { PromptTemplate } from "../../prompts/prompt.js";
import { Sequence } from "../ops.js";
import { run } from "../runner.js";
import { load } from "../../load/index.js";

test("run with prompt+llm sequence", async () => {
  const args = { name: "nuno" };
  const chain = new Sequence(
    PromptTemplate.fromTemplate("Hi, my name is {name}, and yours?"),
    new OpenAI({ temperature: 0, maxTokens: 25 })
  );

  const result = await run(chain, args);
  expect(result).toMatchInlineSnapshot(`
    {
      "0.promptValues": [
        {
          "arguments": [
            "Hi, my name is nuno, and yours?",
          ],
          "fields": undefined,
          "identifier": [
            "langchain",
            "prompts",
            "base",
            "StringPromptValue",
          ],
          "type": "constructor",
          "v": 1,
        },
      ],
      "llmResult": [
        {
          "generations": [
            [
              {
                "generationInfo": {
                  "finishReason": "stop",
                  "logprobs": null,
                },
                "text": "

    My name is [Name]. Nice to meet you.",
              },
            ],
          ],
          "llmOutput": {
            "tokenUsage": {
              "completionTokens": 13,
              "promptTokens": 11,
              "totalTokens": 24,
            },
          },
        },
      ],
    }
  `);

  const chainStr = JSON.stringify(chain, null, 2);
  expect(chainStr).toMatchInlineSnapshot(`
    "{
      "v": 1,
      "type": "constructor",
      "identifier": [
        "langchain",
        "pipes",
        "ops",
        "sequence",
        "Sequence"
      ],
      "arguments": [
        {
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
              "template": "Hi, my name is {name}, and yours?"
            }
          ]
        },
        {
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
              "temperature": 0,
              "maxTokens": 25
            }
          ]
        }
      ]
    }"
  `);

  const chain2 = await load<Sequence>(chainStr);
  const result2 = await run(chain2, args);
  expect(result2).toEqual(result);
});
