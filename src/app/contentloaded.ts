import {Config, getConfig} from "../config";
import type {PostChatCompletionWithDefaults} from "@conjecture-inc/api";
import {getCompletion} from "./conjecture";

export let config: Config | undefined;

const req: PostChatCompletionWithDefaults = {
  model: "conjecture-large",
  messages: [{
    content: "who are you?",
    role: "user"
  }], stream: false
}

export async function afterDOMLoaded(): Promise<void> {
  config = await getConfig();

  console.log("sending request");

  const response = await getCompletion(req);

  console.log(response);
}

