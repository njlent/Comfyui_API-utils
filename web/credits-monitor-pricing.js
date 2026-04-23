const XAI_CREDITS = {
  imageGenerationRun: 6.96,
  imageEditOutputRun: 6.96,
  imageEditInputRun: 0.42,
  videoGenerationOutputPerSecond: 38.19,
  videoGenerationInputImagePerSecond: 0.42,
  videoEditPerSecond: 40.3,
  scaledRawDivisor: 100_000_000
};

const MODEL_TOKEN_RATES = {
  "openai:gpt-image-1": { input_text_tokens: 2110, input_image_tokens: 2110, output_image_tokens: 8440 },
  "openai:gpt-image-1.5": { input_text_tokens: 1688, input_image_tokens: 1688, output_image_tokens: 6752 },
  "openai:gpt-image-2": {
    input_text_tokens: 1055, cached_input_text_tokens: 263.75, input_image_tokens: 1688,
    cached_input_image_tokens: 422, output_image_tokens: 6330
  },
  "vertexai:gemini-2.5-flash": {
    input_text_tokens: 63.3, input_image_tokens: 63.3, input_video_tokens: 63.3,
    input_audio_tokens: 211, output_text_tokens: 527.5, output_audio_tokens: 3165
  },
  "vertexai:gemini-2.5-flash-image": {
    input_text_tokens: 63.3, input_image_tokens: 63.3, input_video_tokens: 63.3,
    input_audio_tokens: 211, output_text_tokens: 527.5, output_image_tokens: 6330
  },
  "vertexai:gemini-2.5-flash-image-preview": {
    input_text_tokens: 63.3, input_image_tokens: 63.3, input_video_tokens: 63.3,
    input_audio_tokens: 211, output_text_tokens: 527.5, output_image_tokens: 6330
  },
  "vertexai:gemini-2.5-pro": {
    input_text_tokens: 263.75, input_image_tokens: 263.75, input_video_tokens: 263.75,
    input_audio_tokens: 263.75, output_text_tokens: 2110
  },
  "vertexai:gemini-2.5-pro-preview-05-06": {
    input_text_tokens: 263.75, input_image_tokens: 263.75, input_video_tokens: 263.75,
    input_audio_tokens: 263.75, output_text_tokens: 2110, output_image_tokens: 7385, output_video_tokens: 8440
  },
  "vertexai:gemini-3.1-flash-image-preview": {
    input_text_tokens: 105.5, input_image_tokens: 105.5, input_video_tokens: 105.5,
    input_audio_tokens: 211, output_text_tokens: 633, thoughts_tokens: 633, output_image_tokens: 12660
  },
  "vertexai:gemini-3-pro-image-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532, output_image_tokens: 25320
  }
};

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function estimateCredits(event) {
  return estimateXaiCredits(event) ?? estimateTokenCredits(event);
}

function rateTableForEvent(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  if (provider === "byteplus" && model.startsWith("dreamina-seedance-2-0")) {
    const perK = params.video_type === "video-to-video" ? 0.907 : 1.477;
    return { total_tokens: perK * 1000 };
  }
  return MODEL_TOKEN_RATES[`${provider}:${model}`] || null;
}

function estimateTokenCredits(event) {
  const rates = rateTableForEvent(event);
  if (!rates) return null;
  const params = event?.params || {};
  const aliases = { input_tokens: "input_text_tokens", output_tokens: "output_text_tokens" };
  let credits = 0;
  let matched = false;
  Object.entries(params).forEach(([rawKey, value]) => {
    const key = aliases[rawKey] || rawKey;
    const rate = rates[key];
    if (rate === undefined) return;
    matched = true;
    credits += (num(value) / 1_000_000) * rate;
  });
  return matched ? credits : null;
}

function estimateXaiCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "xai") return null;
  const endpoint = String(params.endpoint ?? "").toLowerCase();
  const model = String(params.model ?? params.model_name ?? "").toLowerCase();
  const duration = num(params.duration, 0);

  if (endpoint === "v1/images/generations") return XAI_CREDITS.imageGenerationRun;
  if (endpoint === "v1/images/edits") return XAI_CREDITS.imageEditOutputRun + XAI_CREDITS.imageEditInputRun;
  if (endpoint === "v1/videos/generations" && duration > 0) {
    const inputImage = params.type === "image-to-video" ? XAI_CREDITS.videoGenerationInputImagePerSecond : 0;
    return duration * (XAI_CREDITS.videoGenerationOutputPerSecond + inputImage);
  }
  if (endpoint === "v1/videos/edits" && duration > 0) return duration * XAI_CREDITS.videoEditPerSecond;
  if (model === "grok-imagine-image-pro") return XAI_CREDITS.imageEditOutputRun + XAI_CREDITS.imageEditInputRun;
  if (model === "grok-imagine-video") {
    const rawCredits = num(params.credits, 0);
    if (rawCredits > 0) return rawCredits / XAI_CREDITS.scaledRawDivisor;
  }

  const rawCredits = num(params.credits, 0);
  return rawCredits > 0 ? rawCredits / XAI_CREDITS.scaledRawDivisor : null;
}
