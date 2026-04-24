export const COMFY_PRICING_SOURCE = {
  url: "https://docs.comfy.org/tutorials/partner-nodes/pricing",
  checkedAt: "2026-04-24",
  creditsPerUsd: 211
};

export const XAI_CREDITS = {
  imageGenerationRun: 6.96,
  imageEditOutputRun: 6.96,
  imageEditInputRun: 0.42,
  videoGenerationOutputPerSecond: 38.19,
  videoGenerationInputImagePerSecond: 0.42,
  videoEditPerSecond: 40.3,
  scaledRawDivisor: 100_000_000
};

export const CLOUD_WORKFLOW_CREDIT_RATES = [
  { before: "2026-01-24T00:00:00.000Z", creditsPerSecond: 0.39, defaultBillableSeconds: 1 },
  { from: "2026-01-24T00:00:00.000Z", creditsPerSecond: 0.266, defaultBillableSeconds: 1 }
];

export const MODEL_TOKEN_RATES = {
  "openai:gpt-5": { input_text_tokens: 263.75, cached_input_text_tokens: 26.38, output_text_tokens: 2110 },
  "openai:gpt-5-mini": { input_text_tokens: 52.75, cached_input_text_tokens: 5.28, output_text_tokens: 422 },
  "openai:gpt-5-nano": { input_text_tokens: 10.55, cached_input_text_tokens: 1.06, output_text_tokens: 84.4 },
  "openai:gpt-4.1": { input_text_tokens: 422, cached_input_text_tokens: 105.5, output_text_tokens: 1688 },
  "openai:gpt-4.1-mini": { input_text_tokens: 84.4, cached_input_text_tokens: 21.1, output_text_tokens: 337.6 },
  "openai:gpt-4.1-nano": { input_text_tokens: 21.1, cached_input_text_tokens: 5.28, output_text_tokens: 84.4 },
  "openai:o3": { input_text_tokens: 422, cached_input_text_tokens: 105.5, output_text_tokens: 1688 },
  "openai:o4-mini": { input_text_tokens: 232.1, cached_input_text_tokens: 58.03, output_text_tokens: 928.4 },
  "openai:o1": { input_text_tokens: 3165, cached_input_text_tokens: 1582.5, output_text_tokens: 12660 },
  "openai:o1-pro": { input_text_tokens: 31650, output_text_tokens: 126600 },
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
  "vertexai:gemini-2.5-flash-preview-04-17": {
    input_text_tokens: 63.3, input_image_tokens: 63.3, input_video_tokens: 63.3,
    input_audio_tokens: 211, output_text_tokens: 527.5, output_image_tokens: 3165,
    output_video_tokens: 4220, output_audio_tokens: 3165
  },
  "vertexai:gemini-2.5-pro": {
    input_text_tokens: 263.75, input_image_tokens: 263.75, input_video_tokens: 263.75,
    input_audio_tokens: 263.75, output_text_tokens: 2110
  },
  "vertexai:gemini-2.5-pro-preview-05-06": {
    input_text_tokens: 263.75, input_image_tokens: 263.75, input_video_tokens: 263.75,
    input_audio_tokens: 263.75, output_text_tokens: 2110, output_image_tokens: 7385,
    output_video_tokens: 8440, output_audio_tokens: 7385
  },
  "vertexai:gemini-3.1-flash-image-preview": {
    input_text_tokens: 105.5, input_image_tokens: 105.5, output_text_tokens: 633,
    thoughts_tokens: 633, output_image_tokens: 12660
  },
  "vertexai:gemini-3.1-pro-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532,
    output_image_tokens: 25320
  },
  "vertexai:gemini-3.1-flash-lite-preview": {
    input_text_tokens: 52.75, input_image_tokens: 52.75, input_video_tokens: 52.75,
    input_audio_tokens: 105.5, output_text_tokens: 316.5, thoughts_tokens: 316.5
  },
  "vertexai:gemini-3-pro-image-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532,
    output_image_tokens: 25320
  },
  "vertexai:gemini-3-pro-preview": {
    input_text_tokens: 422, input_image_tokens: 422, input_video_tokens: 422,
    input_audio_tokens: 422, output_text_tokens: 2532, thoughts_tokens: 2532
  }
};

export const BYTEPLUS_VIDEO_TOKEN_RATES = [
  { modelPrefix: "seedance-1-0-lite", creditsPerMillion: 379.8, fallbackCredits: 379.8 },
  { modelPrefix: "seedance-1-0-pro-fast", creditsPerMillion: 211, fallbackCredits: 211 },
  { modelPrefix: "seedance-1-0-pro", creditsPerMillion: 527.5, fallbackCredits: 527.5 },
  { modelPrefix: "seedance-1-5-pro", generateAudio: false, creditsPerMillion: 253.2, fallbackCredits: 253.2 },
  { modelPrefix: "seedance-1-5-pro", generateAudio: true, creditsPerMillion: 506.4, fallbackCredits: 506.4 },
  { modelPrefix: "seedream-4-5", videoType: "text-to-video", creditsPerMillion: 211, fallbackCredits: 211 },
  { modelPrefix: "dreamina-seedance-2-0-fast", resolution: "1080p", videoType: "video-to-video", creditsPerThousand: 1.74, fallbackCredits: 1.74 },
  { modelPrefix: "dreamina-seedance-2-0-fast", resolution: "1080p", creditsPerThousand: 2.955, fallbackCredits: 2.955 },
  { modelPrefix: "dreamina-seedance-2-0-fast", resolution: "720p", videoType: "video-to-video", creditsPerThousand: 0.696, fallbackCredits: 0.696 },
  { modelPrefix: "dreamina-seedance-2-0-fast", resolution: "720p", creditsPerThousand: 1.182, fallbackCredits: 1.182 },
  { modelPrefix: "dreamina-seedance-2-0", resolution: "1080p", videoType: "video-to-video", creditsPerThousand: 2.268, fallbackCredits: 2.268 },
  { modelPrefix: "dreamina-seedance-2-0", resolution: "1080p", creditsPerThousand: 3.693, fallbackCredits: 3.693 },
  { modelPrefix: "dreamina-seedance-2-0", resolution: "720p", videoType: "video-to-video", creditsPerThousand: 0.907, fallbackCredits: 0.907 },
  { modelPrefix: "dreamina-seedance-2-0", resolution: "720p", creditsPerThousand: 1.477, fallbackCredits: 1.477 }
];

export const FIXED_RUN_CREDITS = {
  "bfl:flux-dev": 5.28, "bfl:flux-kontext-max": 16.88, "bfl:flux-kontext-pro": 8.44,
  "bfl:flux-pro-1.0-canny": 10.55, "bfl:flux-pro-1.0-depth": 10.55,
  "bfl:flux-pro-1.0-expand": 10.55, "bfl:flux-pro-1.0-fill": 10.55,
  "bfl:flux-pro-1.1": 8.44, "bfl:flux-pro-1.1-ultra": 12.66,
  "bfl:/v1/flux-pro": 10.55, "bfl:flux-2-pro": 6.33, "bfl:flux-2-max": 14.77,
  "byteplus:seededit-3-0-i2i-250628": 6.33, "byteplus:seedream-3-0-t2i-250415": 6.33,
  "byteplus:seedream-4-0-250828": 6.33, "byteplus:seedream-4-5-251128": 8.44,
  "byteplus:seedream-5-0-260128": 7.39,
  "minimax:i2v-01-director": 90.73, "minimax:i2v-01-live": 90.73, "minimax:i2v-01": 90.73,
  "minimax:s2v-01": 137.15, "minimax:t2v-01-director": 90.73, "minimax:t2v-01": 90.73,
  "stability:v2beta/stable-image/generate/core": 6.33,
  "stability:v2beta/stable-image/generate/ultra": 16.88,
  "stability:v2beta/stable-image/upscale/conservative": 84.4,
  "stability:v2beta/stable-image/upscale/creative": 126.6,
  "stability:v2beta/stable-image/upscale/fast": 4.22,
  "stability:sd3.5-large": 13.71, "stability:sd3.5-large-turbo": 8.44,
  "stability:sd3.5-medium": 7.39,
  "wavespeed:seedvr2": 2.11, "wavespeed:ultimate-image-upscaler": 12.66,
  "wavespeed:flashvsr:720p": 12.66, "wavespeed:flashvsr:1080p": 18.99,
  "wavespeed:flashvsr:2k": 25.32, "wavespeed:flashvsr:4k": 33.76,
  "wavespeed:nano-banana-pro/edit:1k": 28.27,
  "wavespeed:nano-banana-pro/edit:2k": 28.27,
  "wavespeed:nano-banana-pro/edit:4k": 50.64,
  "kling:pro:kling-v1-5": 103.39, "kling:pro:kling-v1-6": 103.39,
  "kling:pro:kling-v1": 103.39, "kling:pro:kling-v2-1-master": 295.4,
  "kling:pro:kling-v2-1": 103.39, "kling:pro:kling-v2-5-turbo": 73.85,
  "kling:pro:kling-v2-master": 295.4, "kling:std:kling-v1-5": 59.08,
  "kling:std:kling-v1-6": 59.08, "kling:std:kling-v2-1-master": 295.4,
  "kling:std:kling-v2-1": 59.08, "kling:std:kling-v2-master": 295.4
};

export const MINIMAX_HAILUO_02_RUN_CREDITS = { "10:768p": 118.16, "6:1080p": 103.39, "6:768p": 59.08 };
export const WAN_IMAGE_RUN_CREDITS = { "wan2.5-i2i-preview": 6.33, "wan2.5-t2i-preview": 6.33, "wan2.6-t2i": 6.33 };
export const WAN_VIDEO_CREDITS_PER_SECOND = { "480p": 10.55, "720p": 21.1, "1080p": 31.65 };

export const VEO_RUN_CREDITS = {
  "veo-2.0-generate-001": { default: 105.5 },
  "veo-3.0-generate-preview": { default: 158.25 },
  "veo-3.0-fast-generate-001": { audio: 31.65, silent: 21.1, videoAudio: 253.2, videoSilent: 168.8 },
  "veo-3.0-generate-001": { audio: 84.4, silent: 42.2, videoAudio: 675.2, videoSilent: 337.6 },
  "veo-3.1-fast-generate-preview": { audio: 31.65, silent: 21.1 },
  "veo-3.1-generate-preview": { audio: 84.4, silent: 42.2 }
};

export const SORA_VIDEO_CREDITS_PER_SECOND = {
  "sora-2": { default: 21.1 },
  "sora-2-pro": { default: 63.3, highResolution: 105.5 }
};

export const HITPAW_VIDEO_ENHANCE_RATES = {
  standard: {
    "720p": [2.11, 4.22, 8.44, 12.66],
    "1080p": [3.17, 6.33, 12.66, 18.99],
    "1440p": [4.22, 8.23, 16.46, 24.69],
    "2160p": [5.28, 10.76, 21.31, 32.07],
    "4320p": [6.96, 13.93, 27.85, 41.78]
  },
  ultra: {
    "720p": [3.17, 6.54, 13.08, 19.41],
    "1080p": [4.22, 8.44, 16.88, 25.32],
    "1440p": [5.49, 10.97, 21.94, 32.92],
    "2160p": [7.17, 14.35, 28.49, 42.83],
    "4320p": [9.28, 18.57, 37.14, 55.7]
  },
  gen: {
    "720p": [3.17, 6.33, 12.66, 18.99],
    "1080p": [5.28, 10.55, 21.1, 31.65],
    "1440p": [8.02, 15.82, 31.65, 47.48],
    "2160p": [11.82, 23.84, 47.48, 71.32],
    "4320p": [11.82, 23.84, 47.48, 71.32]
  }
};

export const HITPAW_PHOTO_ENHANCE_RUN_CREDITS = {
  "720p": 13.93,
  "1080p": 27.85,
  "1440p": 27.85,
  "2160p": 69.63
};

export const DOCUMENTED_PRICING_FALLBACKS = [
  { provider: "bria", endpoint: "v2/image/edit", model: "fibo", credits: 8.44, unit: "run" },
  { provider: "bria", endpoint: "v2/image/edit/remove_background", credits: 3.8, unit: "run" },
  { provider: "bria", endpoint: "v2/video/edit/remove_background", credits: 29.54, unit: "sec" },
  { provider: "elevenlabs", endpoint: "v1/text-to-dialogue", model: "eleven_v3", credits: 50.64, unit: "run" },
  { provider: "elevenlabs", endpoint: "v1/text-to-speech", model: "eleven_multilingual_v2", credits: 50.64, unit: "run" },
  { provider: "elevenlabs", endpoint: "v1/text-to-speech", model: "eleven_v3", credits: 50.64, unit: "run" },
  { provider: "elevenlabs", endpoint: "v1/speech-to-text", model: "scribe_v2", credits: 92.84, unit: "run" },
  { provider: "elevenlabs", endpoint: "v1/speech-to-speech", credits: 50.64, unit: "min" },
  { provider: "elevenlabs", endpoint: "v1/sound-generation", credits: 29.54, unit: "min" },
  { provider: "freepik", endpoint: "magnific-relight", credits: 23.21, unit: "run" },
  { provider: "freepik", endpoint: "magnific-style-transfer", credits: 23.21, unit: "run" },
  { provider: "freepik", endpoint: "skin-enhancer-creative", credits: 61.19, unit: "run" },
  { provider: "freepik", endpoint: "skin-enhancer-faithful", credits: 78.07, unit: "run" },
  { provider: "freepik", endpoint: "skin-enhancer-flexible", credits: 94.95, unit: "run" },
  { provider: "ideogram", endpoint: "ideogram-v3/generate", rendering_speed: "turbo", credits: 9.05, unit: "run" },
  { provider: "ideogram", endpoint: "ideogram-v3/generate", rendering_speed: "quality", credits: 27.16, unit: "run" },
  { provider: "ideogram", endpoint: "ideogram-v3/generate", credits: 18.1, unit: "run" },
  { provider: "lightricks", model: "ltx-2-fast", resolution: "1920x1080", credits: 8.44, unit: "sec" },
  { provider: "lightricks", model: "ltx-2-fast", resolution: "2560x1440", credits: 16.88, unit: "sec" },
  { provider: "lightricks", model: "ltx-2-fast", resolution: "3840x2160", credits: 33.76, unit: "sec" },
  { provider: "lightricks", model: "ltx-2-pro", resolution: "1920x1080", credits: 12.66, unit: "sec" },
  { provider: "lightricks", model: "ltx-2-pro", resolution: "2560x1440", credits: 25.32, unit: "sec" },
  { provider: "luma", model: "ray-1-6", credits: 0.97, unit: "sec" },
  { provider: "luma", model: "ray-2", credits: 1.93, unit: "sec" },
  { provider: "luma", model: "ray-flash-2", credits: 0.66, unit: "sec" },
  { provider: "luma", model: "photon-1", credits: 2.2, unit: "run" },
  { provider: "luma", model: "photon-flash-1", credits: 0.57, unit: "run" },
  { provider: "openai", model: "dall-e-2", size: "256x256", credits: 3.38, unit: "image" },
  { provider: "openai", model: "dall-e-2", size: "512x512", credits: 3.8, unit: "image" },
  { provider: "openai", model: "dall-e-2", size: "1024x1024", credits: 4.22, unit: "image" },
  { provider: "openai", model: "dall-e-3", quality: "standard", size: "1024x1024", credits: 8.44, unit: "run" },
  { provider: "openai", model: "dall-e-3", quality: "standard", size: "1024x1792", credits: 16.88, unit: "run" },
  { provider: "openai", model: "dall-e-3", quality: "hd", size: "1024x1024", credits: 16.88, unit: "run" },
  { provider: "openai", model: "dall-e-3", quality: "hd", size: "1024x1792", credits: 25.32, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/i2v", resolution: "1080p", duration: 10, credits: 211, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/i2v", resolution: "720p", duration: 10, credits: 126.6, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikaframes", resolution: "1080p", duration: 10, credits: 211, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikaframes", resolution: "720p", duration: 10, credits: 52.75, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikascenes", resolution: "1080p", duration: 10, credits: 316.5, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikascenes", resolution: "720p", duration: 10, credits: 84.4, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/t2v", resolution: "1080p", duration: 10, credits: 211, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/t2v", resolution: "720p", duration: 10, credits: 126.6, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/i2v", resolution: "1080p", duration: 5, credits: 94.95, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/i2v", resolution: "720p", duration: 5, credits: 42.2, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikaframes", resolution: "1080p", duration: 5, credits: 63.3, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikaframes", resolution: "720p", duration: 5, credits: 42.2, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikascenes", resolution: "1080p", duration: 5, credits: 105.5, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/pikascenes", resolution: "720p", duration: 5, credits: 63.3, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/t2v", resolution: "1080p", duration: 5, credits: 94.95, unit: "run" },
  { provider: "pika", endpoint: "generate/2.2/t2v", resolution: "720p", duration: 5, credits: 42.2, unit: "run" },
  { provider: "pika", endpoint: "generate/pikadditions", credits: 63.3, unit: "run" },
  { provider: "pika", endpoint: "generate/pikaffects", credits: 94.95, unit: "run" },
  { provider: "pika", endpoint: "generate/pikaswaps", credits: 63.3, unit: "run" },
  { provider: "pixverse", model: "v3.5", quality: "360p", credits: 94.95, unit: "run" },
  { provider: "pixverse", model: "v3.5", quality: "540p", credits: 94.95, unit: "run" },
  { provider: "pixverse", model: "v3.5", quality: "720p", credits: 126.6, unit: "run" },
  { provider: "pixverse", model: "v3.5", quality: "1080p", credits: 253.2, unit: "run" },
  { provider: "quiver", model: "arrow-1.1", credits: 60.35, unit: "run" },
  { provider: "quiver", model: "arrow-1.1-max", credits: 75.43, unit: "run" },
  { provider: "recraft", credits: 0.21, unit: "run" },
  { provider: "reve", model: "reve-create@20250915", credits: 7.24, unit: "run" },
  { provider: "reve", model: "reve-edit@20250915", credits: 12.07, unit: "run" },
  { provider: "reve", model: "reve-edit-fast@20251030", credits: 2.11, unit: "run" },
  { provider: "reve", model: "reve-remix@20250915", credits: 12.07, unit: "run" },
  { provider: "reve", model: "reve-remix-fast@20251030", credits: 2.11, unit: "run" },
  { provider: "runway", model: "gen3a_turbo", credits: 15.09, unit: "sec" },
  { provider: "runway", model: "gen4_turbo", credits: 10.55, unit: "sec" },
  { provider: "runway", model: "gen4_image", credits: 24.14, unit: "run" },
  { provider: "sonilo", model: "sonilo", type: "video-to-music", credits: 1.9, unit: "sec" },
  { provider: "sonilo", model: "sonilo", type: "text-to-music", credits: 1.055, unit: "sec" },
  { provider: "stability", endpoint: "v2beta/audio/stable-audio-2/audio-to-audio", model: "stable-audio-2.5", credits: 42.2, unit: "run" },
  { provider: "stability", endpoint: "v2beta/audio/stable-audio-2/inpaint", model: "stable-audio-2.5", credits: 42.2, unit: "run" },
  { provider: "stability", endpoint: "v2beta/audio/stable-audio-2/text-to-audio", model: "stable-audio-2.5", credits: 42.2, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-pro", generate_type: "geometry", credits: 63.3, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-pro", generate_type: "lowpoly", credits: 126.6, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-pro", generate_type: "normal", credits: 105.5, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-pro", generate_type: "sketch", credits: 105.5, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-part", credits: 126.6, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-texture-edit", credits: 126.6, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-uv", credits: 42.2, unit: "run" },
  { provider: "tencent", endpoint: "hunyuan/3d-smart-topology", credits: 211, unit: "run" },
  { provider: "topaz", resolution: "720p", credits: 13.93, unit: "run" },
  { provider: "topaz", resolution: "1080p", credits: 27.85, unit: "run" },
  { provider: "topaz", resolution: "1440p", credits: 27.85, unit: "run" },
  { provider: "topaz", resolution: "2160p", credits: 69.63, unit: "run" },
  { provider: "topaz", model: "slp-2.5", resolution: "1080p", credits: 12.99, unit: "sec" },
  { provider: "topaz", model: "slp-2.5", resolution: "2160p", credits: 28.08, unit: "sec" },
  { provider: "topaz", model: "slf-1", resolution: "1080p", credits: 6.5, unit: "sec" },
  { provider: "topaz", model: "slf-1", resolution: "2160p", credits: 14.16, unit: "sec" },
  { provider: "topaz", model: "slc-1", resolution: "1080p", credits: 43.62, unit: "sec" },
  { provider: "topaz", model: "slc-1", resolution: "2160p", credits: 77.99, unit: "sec" },
  { provider: "topaz", interpolation_model: "apo-8", resolution: "720p", credits: 2.55, unit: "sec" },
  { provider: "topaz", interpolation_model: "apo-8", resolution: "1080p", credits: 5.57, unit: "sec" },
  { provider: "topaz", interpolation_model: "apo-8", resolution: "2160p", credits: 21.59, unit: "sec" },
  { provider: "tripo", model: "v2.0-20240919", type: "text_to_model", credits: 42.2, unit: "run" },
  { provider: "tripo", model: "v2.5-20250123", type: "text_to_model", credits: 42.2, unit: "run" },
  { provider: "tripo", model: "v3.0-20250812", type: "text_to_model", credits: 42.2, unit: "run" },
  { provider: "tripo", type: "image_to_model", credits: 63.3, unit: "run" },
  { provider: "tripo", type: "multiview_to_model", credits: 63.3, unit: "run" },
  { provider: "tripo", type: "refine_model", credits: 63.3, unit: "run" },
  { provider: "tripo", texture_quality: "detailed", credits: 42.2, unit: "run" },
  { provider: "tripo", texture_quality: "standard", credits: 21.1, unit: "run" },
  { provider: "vidu", model: "vidu-q3-pro", resolution: "1080p", credits: 33.76, unit: "sec" },
  { provider: "vidu", model: "vidu-q3-pro", resolution: "720p", credits: 31.65, unit: "sec" },
  { provider: "vidu", model: "vidu-q3-pro", resolution: "540p", credits: 14.77, unit: "sec" },
  { provider: "vidu", model: "vidu-q3-turbo", resolution: "1080p", credits: 16.88, unit: "sec" },
  { provider: "vidu", model: "vidu-q3-turbo", resolution: "720p", credits: 12.66, unit: "sec" },
  { provider: "vidu", model: "vidu-q3-turbo", resolution: "540p", credits: 8.44, unit: "sec" },
  { provider: "vidu", model: "vidu-q1", resolution: "1080p", duration: 5, credits: 84.4, unit: "run" },
  { provider: "vidu", model: "vidu-2.0", resolution: "360p", duration: 4, credits: 21.1, unit: "run" },
  { provider: "vidu", model: "vidu-2.0", resolution: "720p", duration: 4, credits: 42.2, unit: "run" },
  { provider: "vidu", model: "vidu-2.0", resolution: "1080p", duration: 4, credits: 105.5, unit: "run" },
  { provider: "vidu", model: "vidu-2.0", resolution: "720p", duration: 8, credits: 105.5, unit: "run" },
  { provider: "vidu", model: "viduq2", resolution: "1080p", credits: 6.33, unit: "run" },
  { provider: "vidu", model: "viduq2", resolution: "1440p", credits: 8.44, unit: "run" },
  { provider: "vidu", model: "viduq2", resolution: "2160p", credits: 10.55, unit: "run" },
  { provider: "vidu", model: "viduq1", resolution: "1080p", credits: 21.1, unit: "run" }
];
