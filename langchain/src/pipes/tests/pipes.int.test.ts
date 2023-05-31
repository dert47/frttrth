import { OpenAI } from "../../llms/openai.js";
import { PromptTemplate } from "../../prompts/prompt.js";
import { Sequence } from "../ops.js";
import { run } from "../runner.js";
import { load } from "../../load/index.js";

test("run with prompt+llm sequence", async () => {
  const args = { operand: "2" };
  const chain = new Sequence(
    PromptTemplate.fromTemplate("3 + {operand} ="),
    new OpenAI({ temperature: 0, maxTokens: 25, streaming: true, stop: ["\n"] })
  );

  const result = await run(chain, args);
  expect(result).toMatchInlineSnapshot(`
    {
      "0.promptValues": [
        {
          "arguments": [
            "3 + 2 =",
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
      "result": [
        {
          "generations": [
            [
              {
                "generationInfo": {
                  "finishReason": "stop",
                  "logprobs": null,
                },
                "text": " 5",
              },
            ],
          ],
          "llmOutput": {
            "tokenUsage": {},
          },
        },
      ],
      "tokens": " 5",
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
                "operand"
              ],
              "templateFormat": "f-string",
              "template": "3 + {operand} ="
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
              "maxTokens": 25,
              "streaming": true,
              "stop": [
                "\\n"
              ]
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
