import type {FinetuneV2Client, PostChatCompletionWithDefaults} from "@conjecture-inc/api";

import {config} from "../config";

export type PostFinetuneRequest = Parameters<FinetuneV2Client['finetune']>[0];

export const getCompletion = async (request: PostChatCompletionWithDefaults) => {
  if (!config) {
    throw new Error('Config not loaded');
  }

  const response = await fetch(`${config.conjApiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.conjApiKey
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export const finetune = async (request: PostFinetuneRequest) => {
  if (!config) {
    throw new Error('Config not loaded');
  }

  if (request.loras.length === 0) {

    const create = await fetch(`${config.conjApiUrl}/v2/finetune/create_lora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.conjApiKey
      },
      body: JSON.stringify({
        "adapter": {
          "rank": 1,
          "targets": [
            "wq"
          ]
        },
        "init": {
          "type": "normal",
          "mean": 0,
          "std": 0.02,
          "seed": 42
        }
      })
    });

    if (!create.ok) {
      throw new Error(`HTTP error! status: ${create.status}`);
    }

    const lora = (await create.json())['finetune_cache_id'];

    if (!lora) {
      throw new Error('Failed to create LORA - no ID returned');
    }

    request.loras = [{finetune_cache_id: lora}];
  }

  const response = await fetch(`${config.conjApiUrl}/v2/finetune/finetune/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.conjApiKey
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export const finetuneStatus = async (request_id: string) => {
  if (!config) {
    throw new Error('Config not loaded');
  }

  const response = await fetch(`${config.conjApiKey}/v2/finetune/finetune/poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.conjApiKey
    },
    body: JSON.stringify({request_id})
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
const chat: PostChatCompletionWithDefaults = {
  model: "conjecture-large",
  messages: [{
    content: "who are you?",
    role: "user"
  }], stream: false
}



const finetune_data: PostFinetuneRequest = {
  loras: [],
  losses: {"sft": {type: "sft", weight: 1.}},
  optim: {
    lr: 10e-4,
    betas: ["0.9", "0.999"],
    weight_decay: 0.01
  },
  train: {
    dataset: {
      batches: [
        {
          items: [
            {
              messages: [
                {
                  content: "who are you?",
                  role: "user",
                  weight: 0.
                },
                {
                  content: "I am clippy!",
                  role: "assistant",
                  weight: 1.
                },
                {
                  content: "",
                  role: "assistant",
                  weight: 0.
                }
              ]
            }
          ]
        }
      ]
    }
  }
}

/*
  config = await getConfig();

  console.log("sending request", config);

  const response = await getCompletion(chat);

  console.log(response);

  console.log("fine tuning", config);

  const ft = await finetune(finetune_data);

  // const ft = {
  //   "request_id": "db8fc795-e5e3-4356-94cb-c94d05799da2",
  //   "correlation_id": null
  // };

  console.log(ft);

  const status = await finetuneStatus(ft.request_id);

  console.log(status);
 */