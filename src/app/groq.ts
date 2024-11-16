export const getCompletion = async (prompt: string): Promise<any> => {
  const response = await fetch('https://api.groq.com/v1/engines/davinci/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer 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`
    },
    body: JSON.stringify({
      "model": "llama3-8b-8192",
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