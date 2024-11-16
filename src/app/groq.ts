import {config} from "../config";

export const getCompletion = async (prompt: string, model: string = 'llama3-8b-8192'): Promise<string> => {
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
      "messages": [{
        "role": "user",
        "content": prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json())["choices"][0]["message"]["content"];
}