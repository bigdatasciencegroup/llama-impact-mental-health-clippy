import {config} from "../config";

export type Messages = Array<{
  role: 'user' | 'assistant' | 'system';
  content: string;
}>;
export const getCompletion = async (prompt: Messages | string, model: string = 'llama3-8b-8192'): Promise<string> => {
  const messages = typeof prompt === 'string' ? [{role: 'user', content: prompt}] : prompt;
  if (!config) {
    throw new Error('Config not loaded');
  }

  const response = await fetch(`${config.groqApiUrl}/openai/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`
    },
    body: JSON.stringify({
      "model": model,
      "messages": messages
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json())["choices"][0]["message"]["content"];
}