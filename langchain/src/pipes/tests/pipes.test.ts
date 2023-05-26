import { test, expect } from "@jest/globals";

import { PieceContext, Piece, Tuple } from "../types.js";
import { run, stream } from "../runner.js";
import { sequence } from "../ops.js";

test("stream with generator", async () => {
  const piece: Piece = {
    async *asPiece(ctx: PieceContext) {
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
  for await (const [key, value] of stream(piece, args)) {
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
  const piece: Piece = {
    async *asPiece(ctx: PieceContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };

  const args = { hello: "there", bye: "you" };
  const outputs = await run(piece, args, { combineKeys: "array" });
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
  const piece: Piece = {
    async *asPiece(ctx: PieceContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };

  const args = { hello: "there", bye: "you" };
  const outputs = await run(piece, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "bye": "youa",
      "hello": "therea",
    }
  `);
}, 1000);

test("run with pipe", async () => {
  const piece: Piece = {
    async asPiece(ctx: PieceContext) {
      const response = await fetch("http://localhost:80/stream/5");
      await response.body
        ?.pipeThrough(new TextDecoderStream())
        .pipeThrough(
          new TransformStream<string, Tuple>({
            transform(chunk, controller) {
              controller.enqueue(["output", chunk]);
            },
          })
        )
        .pipeTo(ctx.output);
    },

    toJSON() {
      return {};
    },
  };

  const args = {};
  const outputs = await run(piece, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "output": "{"url": "http://localhost/stream/5", "args": {}, "headers": {"Host": "localhost", "Connection": "keep-alive", "Accept": "*/*", "Accept-Language": "*", "Sec-Fetch-Mode": "cors", "User-Agent": "undici", "Accept-Encoding": "gzip, deflate"}, "origin": "172.17.0.1", "id": 0}
    {"url": "http://localhost/stream/5", "args": {}, "headers": {"Host": "localhost", "Connection": "keep-alive", "Accept": "*/*", "Accept-Language": "*", "Sec-Fetch-Mode": "cors", "User-Agent": "undici", "Accept-Encoding": "gzip, deflate"}, "origin": "172.17.0.1", "id": 1}
    {"url": "http://localhost/stream/5", "args": {}, "headers": {"Host": "localhost", "Connection": "keep-alive", "Accept": "*/*", "Accept-Language": "*", "Sec-Fetch-Mode": "cors", "User-Agent": "undici", "Accept-Encoding": "gzip, deflate"}, "origin": "172.17.0.1", "id": 2}
    {"url": "http://localhost/stream/5", "args": {}, "headers": {"Host": "localhost", "Connection": "keep-alive", "Accept": "*/*", "Accept-Language": "*", "Sec-Fetch-Mode": "cors", "User-Agent": "undici", "Accept-Encoding": "gzip, deflate"}, "origin": "172.17.0.1", "id": 3}
    {"url": "http://localhost/stream/5", "args": {}, "headers": {"Host": "localhost", "Connection": "keep-alive", "Accept": "*/*", "Accept-Language": "*", "Sec-Fetch-Mode": "cors", "User-Agent": "undici", "Accept-Encoding": "gzip, deflate"}, "origin": "172.17.0.1", "id": 4}
    ",
    }
  `);
}, 5000);

test("run with sequence", async () => {
  const addA: Piece = {
    async *asPiece(ctx: PieceContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}a`];
      }
    },
    toJSON() {
      return {};
    },
  };
  const addB: Piece = {
    async *asPiece(ctx: PieceContext) {
      for await (const [key, value] of ctx.input) {
        yield [key, `${value}b`];
      }
    },
    toJSON() {
      return {};
    },
  };
  const addC: Piece = {
    async *asPiece(ctx: PieceContext) {
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
