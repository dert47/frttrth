import fetch from "node-fetch";
import { Tool } from "./base";

export class RequestsTool extends Tool {
  name: string;

  description: string;

  constructor() {
    super();
    this.name = "requests";
    this.description =
      "A portal to the internet. Use this when you need to get specific content from a site. Input should be a specific url, and the output will be all the text on that page.";
  }

  async call(input: string): Promise<string> {
    const response = await fetch(input);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return response.text();
  }
}
