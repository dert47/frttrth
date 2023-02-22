import { test } from "@jest/globals";
import { RequestsTool } from "../requests";

test("Requests", async () => {
  const requests = new RequestsTool();
  const result = await requests.call(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  console.log(result);
});
