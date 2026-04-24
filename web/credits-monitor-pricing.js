const XAI_CREDITS = {
  imageGenerationRun: 6.96,
  imageEditOutputRun: 6.96,
  imageEditInputRun: 0.42,
  videoGenerationOutputPerSecond: 38.19,
  videoGenerationInputImagePerSecond: 0.42,
  videoEditPerSecond: 40.3,
  scaledRawDivisor: 100_000_000
};

const BFL_RUN_CREDITS = {
  "flux-dev": 5.28, "flux-kontext-max": 16.88, "flux-kontext-pro": 8.44,
  "flux-pro-1.0-canny": 10.55, "flux-pro-1.0-depth": 10.55, "flux-pro-1.0-expand": 10.55,
  "flux-pro-1.0-fill": 10.55, "flux-pro-1.1": 8.44, "flux-pro-1.1-ultra": 12.66
};

const BYTEPLUS_IMAGE_RUN_CREDITS = {
  "seededit-3-0-i2i": 6.33, "seedream-3-0-t2i": 6.33, "seedream-4-0": 6.33,
  "seedream-4-5": 8.44, "seedream-5-0": 7.39
};

const MINIMAX_RUN_CREDITS = {
  "i2v-01-director": 90.73, "i2v-01-live": 90.73, "i2v-01": 90.73,
  "s2v-01": 137.15, "t2v-01-director": 90.73, "t2v-01": 90.73
};

const MINIMAX_HAILUO_02_RUN_CREDITS = { "10:768p": 118.16, "6:1080p": 103.39, "6:768p": 59.08 };

const VEO_RUN_CREDITS = {
  "veo-2.0-generate-001": { default: 105.5 },
  "veo-3.0-generate-preview": { default: 158.25 },
  "veo-3.0-fast-generate-001": { audio: 31.65, silent: 21.1, videoAudio: 253.2, videoSilent: 168.8 },
  "veo-3.0-generate-001": { audio: 84.4, silent: 42.2, videoAudio: 675.2, videoSilent: 337.6 },
  "veo-3.1-fast-generate-preview": { audio: 31.65, silent: 21.1 },
  "veo-3.1-generate-preview": { audio: 84.4, silent: 42.2 }
};

const WAN_VIDEO_CREDITS_PER_SECOND = { "480p": 10.55, "720p": 21.1, "1080p": 31.65 };

const FIXED_RUN_CREDITS = {
  "byteplus:seedream-4-5-251128": 8.44,
  "byteplus:seedream-5-0-260128": 7.39,
  "stability:v2beta/stable-image/generate/core": 6.33,
  "stability:v2beta/stable-image/generate/ultra": 16.88,
  "stability:v2beta/stable-image/upscale/conservative": 84.4,
  "stability:v2beta/stable-image/upscale/creative": 126.6,
  "stability:v2beta/stable-image/upscale/fast": 4.22,
  "wavespeed:seedvr2": 2.11,
  "wavespeed:ultimate-image-upscaler": 12.66,
  "wavespeed:flashvsr:720p": 12.66,
  "wavespeed:flashvsr:1080p": 18.99,
  "wavespeed:flashvsr:2k": 25.32,
  "wavespeed:flashvsr:4k": 33.76,
  "wavespeed:nano-banana-pro/edit:1k": 28.27,
  "wavespeed:nano-banana-pro/edit:2k": 28.27,
  "wavespeed:nano-banana-pro/edit:4k": 50.64,
  "kling:pro:kling-v2-5-turbo": 73.85,
  "kling:std:kling-v2-5-turbo": 73.85
};

const CLOUD_WORKFLOW_CREDIT_RATES = [
  { before: "2026-01-24T00:00:00.000Z", creditsPerSecond: 0.39, defaultBillableSeconds: 1 },
  { from: "2026-01-24T00:00:00.000Z", creditsPerSecond: 0.266, defaultBillableSeconds: 1 }
];

const MODEL_TOKEN_RATES = {
  "openai:gpt-5": { input_text_tokens: 263.75, cached_input_text_tokens: 26.38, output_text_tokens: 2110 },
  "openai:gpt-5-mini": { input_text_tokens: 52.75, cached_input_text_tokens: 5.28, output_text_tokens: 422 },
  "openai:gpt-5-nano": { input_text_tokens: 10.55, cached_input_text_tokens: 1.06, output_text_tokens: 84.4 },
  "openai:gpt-4.1": { input_text_tokens: 422, cached_input_text_tokens: 105.5, output_text_tokens: 1688 },
  "openai:gpt-4.1-mini": { input_text_tokens: 84.4, cached_input_text_tokens: 21.1, output_text_tokens: 337.6 },
  "openai:gpt-4.1-nano": { input_text_tokens: 21.1, cached_input_text_tokens: 5.28, output_text_tokens: 84.4 },
  "openai:gpt-4o": {
    input_text_tokens: 527.5, cached_input_text_tokens: 263.75, input_image_tokens: 527.5,
    cached_input_image_tokens: 263.75, output_text_tokens: 2110
  },
  "openai:o3": { input_text_tokens: 422, cached_input_text_tokens: 105.5, output_text_tokens: 1688 },
  "openai:o4-mini": { input_text_tokens: 232.1, cached_input_text_tokens: 58.03, output_text_tokens: 928.4 },
  "openai:o1": { input_text_tokens: 3165, cached_input_text_tokens: 1582.5, output_text_tokens: 12660 },
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
  "vertexai:gemini-3.1-pro-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532, output_image_tokens: 25320
  },
  "vertexai:gemini-3.1-flash-lite-preview": {
    input_text_tokens: 52.75, input_image_tokens: 52.75, input_video_tokens: 52.75,
    input_audio_tokens: 105.5, output_text_tokens: 316.5, thoughts_tokens: 316.5
  },
  "vertexai:gemini-3-pro-image-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532, output_image_tokens: 25320
  },
  "vertexai:gemini-3-pro-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532
  }
};

function num(value, fallback = 0) {
  const normalized =
    typeof value === "string"
      ? value.includes(",") && !value.includes(".")
        ? value.replace(",", ".")
        : value.replaceAll(",", "")
      : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  return false;
}

function baseVersionedModel(model) {
  return model.replace(/-\d{6}$/, "");
}

function normalizedResolution(params) {
  const raw =
    params.resolution ??
    params.size ??
    params.quality ??
    (params.width && params.height ? `${params.width}x${params.height}` : "");
  const value = String(raw).toLowerCase().replace(/\s+/g, "");
  if (value.includes("1080")) return "1080p";
  if (value.includes("768")) return "768p";
  if (value.includes("720") || value.includes("1280x720") || value.includes("720x1280")) return "720p";
  if (value.includes("480")) return "480p";
  return value;
}

export function estimateCredits(event) {
  return estimateCloudWorkflowCredits(event) ??
    estimateXaiCredits(event) ??
    estimateFixedCredits(event) ??
    estimateKlingCredits(event) ??
    estimateMinimaxCredits(event) ??
    estimateOpenAiVideoCredits(event) ??
    estimateVeoCredits(event) ??
    estimateWanCredits(event) ??
    estimateTokenCredits(event);
}

function eventDate(event) {
  const value = event?.createdAt || event?.created_at;
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function cloudWorkflowRateFor(date) {
  const time = date.getTime();
  return CLOUD_WORKFLOW_CREDIT_RATES.find((entry) => {
    if (entry.before && time >= new Date(entry.before).getTime()) return false;
    if (entry.from && time < new Date(entry.from).getTime()) return false;
    return true;
  }) || null;
}

function firstNumber(params, keys) {
  for (const key of keys) {
    if (params[key] !== undefined && params[key] !== null) return num(params[key], 0);
  }
  return 0;
}

function durationHoursFromTimestamps(params) {
  const start = params.started_at || params.startedAt || params.start_time || params.startTime;
  const end = params.ended_at || params.endedAt || params.end_time || params.endTime;
  if (!start || !end) return 0;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return (endMs - startMs) / 3_600_000;
}

function cloudWorkflowDurationSeconds(params) {
  const hours = firstNumber(params, [
    "hours", "duration_hours", "durationHours", "billable_hours", "billableHours",
    "runtime_hours", "runtimeHours"
  ]);
  if (hours > 0) return hours * 3600;

  const minutes = firstNumber(params, [
    "minutes", "duration_minutes", "durationMinutes", "billable_minutes", "billableMinutes",
    "runtime_minutes", "runtimeMinutes", "elapsed_minutes", "elapsedMinutes"
  ]);
  if (minutes > 0) return minutes * 60;

  const seconds = firstNumber(params, [
    "seconds", "duration_seconds", "durationSeconds", "billable_seconds", "billableSeconds",
    "runtime_seconds", "runtimeSeconds", "elapsed_seconds", "elapsedSeconds",
    "execution_seconds", "executionSeconds", "gpu_seconds", "gpuSeconds",
    "gpu_time_seconds", "gpuTimeSeconds"
  ]);
  if (seconds > 0) return seconds;

  const milliseconds = firstNumber(params, [
    "milliseconds", "duration_ms", "durationMs", "billable_ms", "billableMs",
    "runtime_ms", "runtimeMs", "elapsed_ms", "elapsedMs", "execution_time_ms", "executionTimeMs"
  ]);
  if (milliseconds > 0) return milliseconds / 1000;

  return durationHoursFromTimestamps(params) * 3600;
}

function durationSeconds(params) {
  const seconds = firstNumber(params, [
    "duration", "duration_seconds", "durationSeconds", "seconds",
    "video_duration", "videoDuration", "output_duration", "outputDuration"
  ]);
  if (seconds > 0) return seconds;

  const milliseconds = firstNumber(params, ["duration_ms", "durationMs"]);
  if (milliseconds > 0) return milliseconds / 1000;

  return 0;
}

function estimateCloudWorkflowCredits(event) {
  if (event?.event_type !== "cloud_workflow_executed" && event?.eventType !== "cloud_workflow_executed") return null;
  const rate = cloudWorkflowRateFor(eventDate(event));
  if (!rate) return null;
  const seconds = cloudWorkflowDurationSeconds(event?.params || {}) || rate.defaultBillableSeconds || 0;
  if (!seconds) return null;
  return seconds * rate.creditsPerSecond;
}

function byteplusVideoRate(params, model) {
  const baseModel = baseVersionedModel(model);
  if (baseModel.startsWith("seedance-1-0-lite")) return 379.8;
  if (baseModel.startsWith("seedance-1-0-pro-fast")) return 211;
  if (baseModel.startsWith("seedance-1-0-pro")) return 527.5;
  if (baseModel.startsWith("seedance-1-5-pro")) return bool(params.generate_audio ?? params.generateAudio) ? 506.4 : 253.2;
  if (model.startsWith("dreamina-seedance-2-0")) {
    const resolutionMultiplier = normalizedResolution(params) === "1080p" ? 2.5 : 1;
    const isFast = model.startsWith("dreamina-seedance-2-0-fast");
    const perK = params.video_type === "video-to-video"
      ? (isFast ? 0.696 : 0.907)
      : (isFast ? 1.182 : 1.477);
    return perK * resolutionMultiplier * 1000;
  }
  return null;
}

function rateTableForEvent(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  if (provider === "byteplus") {
    const rate = byteplusVideoRate(params, model);
    if (rate) return { total_tokens: rate };
  }
  return MODEL_TOKEN_RATES[`${provider}:${model}`] || null;
}

function byteplusVideoTokenFallbackCredits(params, ratePerMillion) {
  const fps = firstNumber(params, ["fps", "frame_rate", "frameRate"]) || 24;
  const width = firstNumber(params, ["width", "output_width", "outputWidth"]);
  const height = firstNumber(params, ["height", "output_height", "outputHeight"]);
  const seconds = durationSeconds(params);
  if (!width || !height || !seconds) return null;
  const tokens = (seconds * width * height * fps) / 1024;
  return (tokens / 1_000_000) * ratePerMillion;
}

function estimateTokenCredits(event) {
  const rates = rateTableForEvent(event);
  if (!rates) return null;
  const params = event?.params || {};
  if (rates.total_tokens !== undefined) {
    const tokens = firstNumber(params, ["total_tokens", "totalTokens", "output_tokens", "outputTokens", "tokens", "video_tokens"]);
    return tokens > 0
      ? (tokens / 1_000_000) * rates.total_tokens
      : byteplusVideoTokenFallbackCredits(params, rates.total_tokens);
  }
  const aliases = {
    input_tokens: "input_text_tokens",
    prompt_tokens: "input_text_tokens",
    output_tokens: "output_text_tokens",
    completion_tokens: "output_text_tokens",
    cached_tokens: "cached_input_text_tokens",
    cached_input_tokens: "cached_input_text_tokens",
    input_cached_tokens: "cached_input_text_tokens"
  };
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

function byteplusImageRunCredits(model) {
  const baseModel = baseVersionedModel(model);
  if (BYTEPLUS_IMAGE_RUN_CREDITS[baseModel]) return BYTEPLUS_IMAGE_RUN_CREDITS[baseModel];
  if (baseModel.startsWith("seedream-4-0")) return BYTEPLUS_IMAGE_RUN_CREDITS["seedream-4-0"];
  if (baseModel.startsWith("seedream-4-5")) return BYTEPLUS_IMAGE_RUN_CREDITS["seedream-4-5"];
  if (baseModel.startsWith("seedream-5-0")) return BYTEPLUS_IMAGE_RUN_CREDITS["seedream-5-0"];
  return null;
}

function estimateFixedCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  const endpoint = String(params.endpoint ?? "").toLowerCase();
  const generatedImages = Math.max(1, num(params.generated_images ?? params.n ?? params.count, 1));
  const resolution = String(params.resolution ?? "").toLowerCase();

  if (provider === "bfl" && BFL_RUN_CREDITS[model]) return BFL_RUN_CREDITS[model] * generatedImages;
  if (provider === "byteplus") {
    const imageCredits = byteplusImageRunCredits(model);
    if (imageCredits) return imageCredits * generatedImages;
    if (FIXED_RUN_CREDITS[`${provider}:${model}`]) return FIXED_RUN_CREDITS[`${provider}:${model}`] * generatedImages;
  }
  if (provider === "stability" && FIXED_RUN_CREDITS[`${provider}:${endpoint}`]) {
    return FIXED_RUN_CREDITS[`${provider}:${endpoint}`];
  }
  if (provider === "wavespeed") {
    if (endpoint === "flashvsr" && FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution}`]) {
      return FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution}`];
    }
    if (endpoint === "nano-banana-pro/edit") {
      return FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution || "1k"}`] || null;
    }
    return FIXED_RUN_CREDITS[`${provider}:${endpoint}`] || null;
  }
  return null;
}

function estimateMinimaxCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "minimax") return null;
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  if (MINIMAX_RUN_CREDITS[model]) return MINIMAX_RUN_CREDITS[model];
  if (model !== "minimax-hailuo-02") return null;

  const seconds = durationSeconds(params);
  const resolution = normalizedResolution(params) || "768p";
  return MINIMAX_HAILUO_02_RUN_CREDITS[`${seconds}:${resolution}`] || null;
}

function estimateOpenAiVideoCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "openai") return null;
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  if (!model.startsWith("sora-2")) return null;
  const seconds = durationSeconds(params);
  if (!seconds) return null;
  const size = String(params.size ?? params.resolution ?? "").toLowerCase();
  if (model === "sora-2") return seconds * 21.1;
  if (model === "sora-2-pro") {
    const highResolution = size.includes("1024x1792") || size.includes("1792x1024");
    return seconds * (highResolution ? 105.5 : 63.3);
  }
  return null;
}

function estimateVeoCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "veo" && provider !== "google" && provider !== "vertexai") return null;
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  const rates = VEO_RUN_CREDITS[model];
  if (!rates) return null;
  if (rates.default) return rates.default;

  const generateAudio = bool(params.generate_audio ?? params.generateAudio);
  const endpoint = String(params.endpoint ?? params.product ?? params.node ?? "").toLowerCase();
  const useVideoRate = endpoint.includes("video") && rates.videoAudio !== undefined;
  if (useVideoRate) return generateAudio ? rates.videoAudio : rates.videoSilent;
  return generateAudio ? rates.audio : rates.silent;
}

function estimateWanCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "wan") return null;
  const model = String(params.model ?? params.model_name ?? params.engine ?? "").toLowerCase();
  if (model.startsWith("wan2.5-i2i") || model.startsWith("wan2.5-t2i") || model.startsWith("wan2.6-t2i")) {
    return 6.33;
  }
  if (!/^wan2\.(5|6|7)-/.test(model)) return null;
  const seconds = durationSeconds(params);
  if (!seconds) return null;
  const resolution = normalizedResolution(params) || "720p";
  const rate = WAN_VIDEO_CREDITS_PER_SECOND[resolution] || WAN_VIDEO_CREDITS_PER_SECOND["720p"];
  return seconds * rate;
}

function estimateKlingCredits(event) {
  const params = event?.params || {};
  const provider = String(params.api_name ?? params.provider ?? params.service ?? "").toLowerCase();
  if (provider !== "kling") return null;
  const model = String(params.model ?? params.model_name ?? "").toLowerCase();
  const endpoint = String(params.endpoint ?? "").toLowerCase();
  const mode = String(params.mode ?? "pro").toLowerCase();
  const duration = num(params.duration, 0);
  const finalUnitDeduction = num(params.final_unit_deduction, 0);

  if (FIXED_RUN_CREDITS[`kling:${mode}:${model}`]) return FIXED_RUN_CREDITS[`kling:${mode}:${model}`];

  if (model === "kling-video-o1") {
    const seconds = duration || inferKlingDuration(finalUnitDeduction);
    if (!seconds) return null;
    const ratePerSecond = Boolean(params.generate_with_video)
      ? (mode === "pro" ? 35.45 : 26.59)
      : (mode === "pro" ? 23.63 : 17.72);
    return seconds * ratePerSecond;
  }

  if (model.startsWith("kling-v3")) {
    const seconds = duration || inferKlingDuration(finalUnitDeduction);
    if (!seconds) return null;
    return seconds * (mode === "pro" ? 23.63 : 17.72);
  }

  if (endpoint === "videos/image2video" || endpoint === "videos/text2video") {
    const seconds = duration || inferLegacyKlingDuration(model);
    if (!seconds) return null;
    return seconds * (mode === "pro" ? 23.63 : 17.72);
  }

  return null;
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

function inferKlingDuration(finalUnitDeduction) {
  if (!finalUnitDeduction) return 0;
  return finalUnitDeduction / 1.2;
}

function inferLegacyKlingDuration(model) {
  if (model.includes("10")) return 10;
  if (model.includes("5")) return 5;
  return 0;
}
