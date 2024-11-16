import {Config, getConfig} from "../config";
import type {PostChatCompletionWithDefaults} from "@conjecture-inc/api";
import {finetune, finetuneStatus, getCompletion, PostFinetuneRequest} from "./conjecture";

export let config: Config | undefined;

export async function afterDOMLoaded(): Promise<void> {

}

