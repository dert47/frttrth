import { Serialized } from "../schema/serde.js";
import { consume } from "./runner.js";
import { NodeContext, Node } from "./types.js";

// TODO Implement interruptOnError
// export interface SequenceOptions {
//   interruptOnError?: boolean;
// }

export function sequence(...pieces: Node[]): Node {
  return {
    async asNode(ctx: NodeContext) {
      let { input } = ctx;
      for (const piece of pieces) {
        input = consume(piece, ...NodeContext.create({ ...ctx, input }));
      }
      await input.pipeTo(ctx.output);
    },

    toJSON(): Serialized {
      return {
        v: 1,
        type: "function",
        identifier: ["langchain", "pipes", "ops", "sequence"],
        arguments: pieces,
      };
    },
  };
}
