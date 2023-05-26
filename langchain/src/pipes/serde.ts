import { Serialized } from "../schema/serde.js";

async function reviver(value: unknown): Promise<unknown> {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "v" in value &&
    "type" in value &&
    "identifier" in value &&
    "arguments" in value &&
    value.v === 1
  ) {
    const serialized = value as Serialized;
    const [name, ...namespaceReverse] = serialized.identifier.slice().reverse();
    const namespace = namespaceReverse.reverse();

    namespace[0] = ".."; // TODO this is only for jest, remove this

    const module = await import(namespace.join("/"));
    const builder = module[name];
    const args = await Promise.all(serialized.arguments.map(reviver));
    if (typeof builder !== "function") {
      throw new Error(`Invalid ${name} for ${namespace.join("/")}`);
    }
    if (serialized.type === "constructor") {
      // eslint-disable-next-line new-cap
      return new builder(...args);
    } else if (serialized.type === "function") {
      return builder(...args);
    } else {
      throw new Error(`Invalid type ${serialized.type}`);
    }
  } else if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return Promise.all(value.map(reviver));
    } else {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(value).map(async ([key, value]) => [
            key,
            await reviver(value),
          ])
        )
      );
    }
  }
  return value;
}

export async function deserialize<T>(text: string): Promise<T> {
  const json = JSON.parse(text);
  return reviver(json) as Promise<T>;
}
