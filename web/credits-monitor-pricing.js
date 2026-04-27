import {
  BYTEPLUS_VIDEO_TOKEN_RATES,
  CLOUD_WORKFLOW_CREDIT_RATES,
  DOCUMENTED_PRICING_FALLBACKS,
  FIXED_RUN_CREDITS,
  HITPAW_PHOTO_ENHANCE_RUN_CREDITS,
  HITPAW_VIDEO_ENHANCE_RATES,
  MINIMAX_HAILUO_02_RUN_CREDITS,
  MODEL_TOKEN_RATES,
  SORA_VIDEO_CREDITS_PER_SECOND,
  VEO_RUN_CREDITS,
  WAN_IMAGE_RUN_CREDITS,
  WAN_VIDEO_CREDITS_PER_SECOND,
  XAI_CREDITS
} from "./credits-monitor-pricing-data.js";

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

function text(value) {
  return String(value ?? "").toLowerCase();
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
  const value = text(raw).replace(/\s+/g, "");
  if (value.includes("2160") || value.includes("4k")) return "2160p";
  if (value.includes("4320") || value.includes("8k")) return "4320p";
  if (value.includes("1440") || value.includes("2k")) return "1440p";
  if (value.includes("1080")) return "1080p";
  if (value.includes("768")) return "768p";
  if (value.includes("720") || value.includes("1280x720") || value.includes("720x1280")) return "720p";
  if (value.includes("540")) return "540p";
  if (value.includes("480")) return "480p";
  if (value.includes("360")) return "360p";
  return value;
}

export function estimateCredits(event) {
  return estimateCloudWorkflowCredits(event) ??
    estimateXaiCredits(event) ??
    estimateKlingCredits(event) ??
    estimateMinimaxCredits(event) ??
    estimateOpenAiVideoCredits(event) ??
    estimateVeoCredits(event) ??
    estimateWanCredits(event) ??
    estimateHitpawCredits(event) ??
    estimateTokenCredits(event) ??
    estimateFixedCredits(event) ??
    estimateDocumentedFallbackCredits(event);
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

function fpsBucket(params) {
  const fps = firstNumber(params, ["fps", "frame_rate", "frameRate", "output_fps", "outputFps"]);
  if (!fps || fps < 30) return 0;
  if (fps < 60) return 1;
  if (fps < 120) return 2;
  return 3;
}

function estimateCloudWorkflowCredits(event) {
  if (event?.event_type !== "cloud_workflow_executed" && event?.eventType !== "cloud_workflow_executed") return null;
  const rate = cloudWorkflowRateFor(eventDate(event));
  if (!rate) return null;
  const seconds = cloudWorkflowDurationSeconds(event?.params || {}) || rate.defaultBillableSeconds || 0;
  return seconds ? seconds * rate.creditsPerSecond : null;
}

function byteplusVideoRate(params, model) {
  const baseModel = baseVersionedModel(model);
  const resolution = normalizedResolution(params) || "720p";
  const videoType = text(params.video_type ?? params.videoType);
  const generateAudio = bool(params.generate_audio ?? params.generateAudio);
  return BYTEPLUS_VIDEO_TOKEN_RATES.find((entry) => {
    if (!baseModel.startsWith(entry.modelPrefix)) return false;
    if (entry.generateAudio !== undefined && entry.generateAudio !== generateAudio) return false;
    if (entry.resolution && entry.resolution !== resolution) return false;
    if (entry.videoType && entry.videoType !== videoType) return false;
    return true;
  }) || null;
}

function rateTableForEvent(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  const model = text(params.model ?? params.model_name ?? params.engine);
  if (provider === "byteplus") {
    const rate = byteplusVideoRate(params, model);
    if (rate) return { total_tokens: rate.creditsPerMillion, total_k_tokens: rate.creditsPerThousand, fallback: rate.fallbackCredits };
  }
  return MODEL_TOKEN_RATES[`${provider}:${model}`] || null;
}

function byteplusVideoTokenFallbackCredits(params, rate) {
  const perMillion = rate.total_tokens;
  const perThousand = rate.total_k_tokens;
  const fps = firstNumber(params, ["fps", "frame_rate", "frameRate"]) || 24;
  const width = firstNumber(params, ["width", "output_width", "outputWidth"]);
  const height = firstNumber(params, ["height", "output_height", "outputHeight"]);
  const seconds = durationSeconds(params);
  if (!width || !height || !seconds) return rate.fallback ?? null;
  const tokens = (seconds * width * height * fps) / 1024;
  if (perThousand !== undefined) return (tokens / 1000) * perThousand;
  return (tokens / 1_000_000) * perMillion;
}

function estimateTokenCredits(event) {
  const rates = rateTableForEvent(event);
  if (!rates) return null;
  const params = event?.params || {};
  if (rates.total_tokens !== undefined || rates.total_k_tokens !== undefined) {
    const tokens = firstNumber(params, ["total_tokens", "totalTokens", "output_tokens", "outputTokens", "tokens", "video_tokens"]);
    if (tokens > 0 && rates.total_k_tokens !== undefined) return (tokens / 1000) * rates.total_k_tokens;
    if (tokens > 0) return (tokens / 1_000_000) * rates.total_tokens;
    return byteplusVideoTokenFallbackCredits(params, rates);
  }

  const aliases = {
    input_tokens: "input_text_tokens", prompt_tokens: "input_text_tokens",
    output_tokens: "output_text_tokens", completion_tokens: "output_text_tokens",
    cached_tokens: "cached_input_text_tokens", cached_input_tokens: "cached_input_text_tokens",
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
  return matched ? credits : documentedTokenFallback(rates) ?? null;
}

function documentedTokenFallback(rates) {
  return rates.output_image_tokens ??
    rates.output_text_tokens ??
    rates.output_video_tokens ??
    rates.output_audio_tokens ??
    rates.input_text_tokens ??
    null;
}

function estimateFixedCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  const model = text(params.model ?? params.model_name ?? params.engine);
  const endpoint = text(params.endpoint);
  const generatedImages = Math.max(1, num(params.generated_images ?? params.n ?? params.count, 1));
  const resolution = text(params.resolution);

  const direct = FIXED_RUN_CREDITS[`${provider}:${model}`];
  if (direct) return direct * generatedImages;
  if (provider === "stability" && FIXED_RUN_CREDITS[`${provider}:${endpoint}`]) return FIXED_RUN_CREDITS[`${provider}:${endpoint}`];
  if (provider === "wavespeed") {
    if (endpoint === "flashvsr" && FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution}`]) return FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution}`];
    if (endpoint === "nano-banana-pro/edit") return FIXED_RUN_CREDITS[`${provider}:${endpoint}:${resolution || "1k"}`] || null;
    return FIXED_RUN_CREDITS[`${provider}:${endpoint}`] || null;
  }
  return null;
}

function estimateMinimaxCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "minimax") return null;
  const model = text(params.model ?? params.model_name ?? params.engine);
  const fixed = FIXED_RUN_CREDITS[`${provider}:${model}`];
  if (fixed) return fixed;
  if (model !== "minimax-hailuo-02") return null;

  const seconds = durationSeconds(params);
  const resolution = normalizedResolution(params) || "768p";
  return MINIMAX_HAILUO_02_RUN_CREDITS[`${seconds}:${resolution}`] ||
    MINIMAX_HAILUO_02_RUN_CREDITS[`6:${resolution}`] ||
    MINIMAX_HAILUO_02_RUN_CREDITS["6:768p"];
}

function estimateOpenAiVideoCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "openai") return null;
  const model = text(params.model ?? params.model_name ?? params.engine);
  const rates = SORA_VIDEO_CREDITS_PER_SECOND[model];
  if (!rates) return null;
  const seconds = durationSeconds(params);
  const size = text(params.size ?? params.resolution);
  const highResolution = size.includes("1024x1792") || size.includes("1792x1024");
  const rate = highResolution && rates.highResolution ? rates.highResolution : rates.default;
  return seconds ? seconds * rate : rate;
}

function estimateVeoCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "veo" && provider !== "google" && provider !== "vertexai") return null;
  const model = text(params.model ?? params.model_name ?? params.engine);
  const rates = VEO_RUN_CREDITS[model];
  if (!rates) return null;
  if (rates.default) return rates.default;

  const generateAudio = bool(params.generate_audio ?? params.generateAudio);
  const endpoint = text(params.endpoint ?? params.product ?? params.node);
  const useVideoRate = endpoint.includes("video") && rates.videoAudio !== undefined;
  if (useVideoRate) return generateAudio ? rates.videoAudio : rates.videoSilent;
  return generateAudio ? rates.audio : rates.silent;
}

function estimateWanCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "wan") return null;
  const model = text(params.model ?? params.model_name ?? params.engine);
  if (WAN_IMAGE_RUN_CREDITS[model]) return WAN_IMAGE_RUN_CREDITS[model];
  if (!/^wan2\.(5|6|7)-/.test(model)) return null;
  const seconds = durationSeconds(params);
  const resolution = normalizedResolution(params) || "720p";
  const rate = WAN_VIDEO_CREDITS_PER_SECOND[resolution] || WAN_VIDEO_CREDITS_PER_SECOND["720p"];
  return seconds ? seconds * rate : rate;
}

function estimateHitpawCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "hitpaw") return null;

  const resolution = normalizedResolution(params) || "1080p";
  const product = text(params.product ?? params.product_name ?? params.endpoint ?? params.node ?? params.type);
  const mode = text(params.type ?? params.mode ?? params.quality ?? params.model ?? params.model_name);
  if (product.includes("photo") || product.includes("image")) {
    return HITPAW_PHOTO_ENHANCE_RUN_CREDITS[resolution] || HITPAW_PHOTO_ENHANCE_RUN_CREDITS["1080p"];
  }

  const kind =
    mode.includes("ultra") ? "ultra" :
      mode.includes("gen") ? "gen" :
        "standard";
  const bucket = fpsBucket(params);
  const rate = HITPAW_VIDEO_ENHANCE_RATES[kind]?.[resolution]?.[bucket] ||
    HITPAW_VIDEO_ENHANCE_RATES[kind]?.["1080p"]?.[bucket];
  return rate ? rate * (durationSeconds(params) || 1) : null;
}

function estimateKlingCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "kling") return null;
  const model = text(params.model ?? params.model_name);
  const endpoint = text(params.endpoint);
  const mode = klingMode(params);
  const duration = durationSeconds(params);
  const finalUnitDeduction = firstNumber(params, ["final_unit_deduction", "finalUnitDeduction"]);

  if (FIXED_RUN_CREDITS[`kling:${mode}:${model}`]) return FIXED_RUN_CREDITS[`kling:${mode}:${model}`];

  if (endpoint === "videos/omni-video") {
    const seconds = duration || finalUnitDeduction || 1;
    return seconds * klingOmniCreditsPerSecond(params, mode);
  }

  if (model === "kling-video-o1") {
    const seconds = duration || inferKlingDuration(finalUnitDeduction) || 1;
    return seconds * klingOmniCreditsPerSecond(params, mode);
  }

  if (model.startsWith("kling-v3")) {
    const seconds = duration || inferKlingDuration(finalUnitDeduction) || 1;
    return seconds * (mode === "pro" ? 23.63 : 17.72);
  }

  if (endpoint === "videos/image2video" || endpoint === "videos/text2video") {
    const seconds = duration || inferLegacyKlingDuration(model) || 1;
    return seconds * (mode === "pro" ? 23.63 : 17.72);
  }

  return null;
}

function klingOmniCreditsPerSecond(params, mode) {
  return klingOmniHasVideoInput(params)
    ? (mode === "pro" ? 35.45 : 26.59)
    : (mode === "pro" ? 23.63 : 17.72);
}

function klingMode(params) {
  const mode = text(params.mode);
  if (mode) return mode;
  return normalizedResolution(params) === "720p" ? "std" : "pro";
}

function klingOmniHasVideoInput(params) {
  if (params.generate_with_video !== undefined || params.generateWithVideo !== undefined) {
    return bool(params.generate_with_video ?? params.generateWithVideo);
  }
  if (hasValue(params.video_list ?? params.videoList)) return true;
  if (hasValue(params.video) || hasValue(params.reference_video ?? params.referenceVideo)) return true;
  if (hasValue(params.input_video ?? params.inputVideo) || hasValue(params.source_video ?? params.sourceVideo)) return true;
  if (hasValue(params.base_video ?? params.baseVideo)) return true;
  if (params.keep_original_sound !== undefined || params.keepOriginalSound !== undefined) return true;

  const descriptor = text([
    params.node,
    params.node_id,
    params.nodeId,
    params.class_type,
    params.classType,
    params.product,
    params.product_name,
    params.type
  ].filter(Boolean).join(" "));
  return descriptor.includes("editvideo") ||
    descriptor.includes("edit video") ||
    descriptor.includes("video-to-video") ||
    descriptor.includes("videotovideo");
}

function hasValue(value) {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function estimateXaiCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  if (provider !== "xai") return null;
  const endpoint = text(params.endpoint);
  const model = text(params.model ?? params.model_name);
  const duration = num(params.duration, 0);

  if (endpoint === "v1/images/generations") return XAI_CREDITS.imageGenerationRun;
  if (endpoint === "v1/images/edits") return XAI_CREDITS.imageEditOutputRun + XAI_CREDITS.imageEditInputRun;
  if (endpoint === "v1/videos/generations") {
    const inputImage = params.type === "image-to-video" ? XAI_CREDITS.videoGenerationInputImagePerSecond : 0;
    return (duration || 1) * (XAI_CREDITS.videoGenerationOutputPerSecond + inputImage);
  }
  if (endpoint === "v1/videos/edits") return (duration || 1) * XAI_CREDITS.videoEditPerSecond;
  if (model === "grok-imagine-image-pro") return XAI_CREDITS.imageEditOutputRun + XAI_CREDITS.imageEditInputRun;
  if (model === "grok-imagine-video") {
    const rawCredits = num(params.credits, 0);
    if (rawCredits > 0) return rawCredits / XAI_CREDITS.scaledRawDivisor;
  }

  const rawCredits = num(params.credits, 0);
  return rawCredits > 0 ? rawCredits / XAI_CREDITS.scaledRawDivisor : null;
}

function estimateDocumentedFallbackCredits(event) {
  const params = event?.params || {};
  const provider = text(params.api_name ?? params.provider ?? params.service);
  const scored = DOCUMENTED_PRICING_FALLBACKS
    .map((entry) => ({ entry, score: pricingFallbackScore(entry, provider, params) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.entry;
  return scored ? priceUnitCredits(scored, params) : null;
}

function pricingFallbackScore(entry, provider, params) {
  if (entry.provider !== provider) return 0;
  let score = 1;
  for (const key of [
    "model", "endpoint", "type", "quality", "rendering_speed",
    "generate_type", "interpolation_model", "texture_quality"
  ]) {
    if (entry[key] === undefined) continue;
    const value = text(params[key] ?? params[camelKey(key)] ?? (key === "model" ? params.model_name ?? params.engine : ""));
    if (value !== text(entry[key])) return 0;
    score += 2;
  }
  if (entry.resolution && normalizedResolution(params) !== entry.resolution) return 0;
  if (entry.resolution) score += 2;
  if (entry.size && !text(params.size ?? params.resolution).includes(entry.size)) return 0;
  if (entry.size) score += 2;
  if (entry.duration && durationSeconds(params) && durationSeconds(params) !== entry.duration) return 0;
  if (entry.duration) score += 1;
  return score;
}

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function priceUnitCredits(entry, params) {
  if (entry.unit === "sec") return entry.credits * (durationSeconds(params) || 1);
  if (entry.unit === "min") return entry.credits * (firstNumber(params, ["minutes", "duration_minutes", "durationMinutes"]) || 1);
  if (entry.unit === "image") return entry.credits * Math.max(1, num(params.n ?? params.count ?? params.generated_images, 1));
  return entry.credits;
}

function inferKlingDuration(finalUnitDeduction) {
  return finalUnitDeduction ? finalUnitDeduction / 1.2 : 0;
}

function inferLegacyKlingDuration(model) {
  if (model.includes("10")) return 10;
  if (model.includes("5")) return 5;
  return 0;
}
