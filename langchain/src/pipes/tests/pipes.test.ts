import { test, expect } from "@jest/globals";

import { NodeContext, Node } from "../types.js";
import { run, stream } from "../runner.js";
import { sequence } from "../ops.js";

test("stream with generator", async () => {
  const node: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };

  const args = { hello: "there", bye: "you" };
  const outputs = [];
  for await (const [key, value] of stream(node, args)) {
    outputs.push([key, value]);
  }
  expect(outputs).toMatchInlineSnapshot(`
    [
      [
        "hello",
        "therea",
      ],
      [
        "bye",
        "youa",
      ],
    ]
  `);
}, 1000);

test("run to arrays", async () => {
  const node: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };

  const args = { hello: "there", bye: "you" };
  const outputs = await run(node, args, { combineKeys: "array" });
  expect(outputs).toMatchInlineSnapshot(`
    {
      "bye": [
        "youa",
      ],
      "hello": [
        "therea",
      ],
    }
  `);
}, 1000);

test("run to strings", async () => {
  const node: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };

  const args = { hello: "there", bye: "you" };
  const outputs = await run(node, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "bye": "youa",
      "hello": "therea",
    }
  `);
}, 1000);

test("run with pipe", async () => {
  const node: Node = {
    async asNode(ctx: NodeContext) {
      const response = await fetch("https://httpstat.us/200");
      await response.body
        ?.pipeThrough(new TextDecoderStream())
        .pipeTo(ctx.output);
    },

    toJSON() {
      return {};
    },
  };

  const args = {};
  const outputs = await run(node, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "text": "200 OK",
    }
  `);
}, 5000);

test("run with sequence", async () => {
  const addA: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };
  const addB: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}b`];
      }
    },
    toJSON() {
      return {};
    },
  };
  const addC: Node = {
    async *asNode(ctx: NodeContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}c`];
      }
    },
    toJSON() {
      return {};
    },
  };
  const args = { hello: "", bye: "" };
  const seqABC = sequence(addA, addB, addC);
  const seqCBA = sequence(addC, addB, addA);
  const seqACB = sequence(addA, addC, addB);
  const seqBCA = sequence(addB, addC, addA);

  expect(await run(seqABC, args)).toMatchInlineSnapshot(`
    {
      "bye": "abc",
      "hello": "abc",
    }
  `);
  expect(await run(seqCBA, args)).toMatchInlineSnapshot(`
    {
      "bye": "cba",
      "hello": "cba",
    }
  `);
  expect(await run(seqACB, args)).toMatchInlineSnapshot(`
    {
      "bye": "acb",
      "hello": "acb",
    }
  `);
  expect(await run(seqBCA, args)).toMatchInlineSnapshot(`
    {
      "bye": "bca",
      "hello": "bca",
    }
  `);
}, 1000);
