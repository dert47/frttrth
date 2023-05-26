import { Serialized } from "../schema/serde.js";
import { consume } from "./runner.js";
import { PieceContext, Piece } from "./types.js";

export function sequence(...pieces: Piece[]): Piece {
  return {
    async asPiece(ctx: PieceContext) {
      let { input } = ctx;
      for (const piece of pieces) {
        input = consume(piece, ...PieceContext.create({ ...ctx, input }));
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
