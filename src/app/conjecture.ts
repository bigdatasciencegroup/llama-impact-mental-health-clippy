import type {PostChatCompletionWithDefaults} from "@conjecture-inc/api";

import {config} from "./contentloaded";


export const getCompletion = async (request: PostChatCompletionWithDefaults) => {
  if (!config) {
    throw new Error('Config not loaded');
  }

  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}