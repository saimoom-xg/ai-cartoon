export function imageGenerationRequestFailure(error: unknown): string {
  const details =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : undefined;
  const status = details?.status ?? details?.statusCode;

  if (status === 401 || status === 403) {
    return "Gemini rejected the image API key or this key does not have access to the configured image model.";
  }
  if (status === 404) {
    return "The configured Gemini image model was not found. Check GEMINI_IMAGE_MODEL.";
  }
  if (status === 429) {
    return "Gemini image-generation quota or rate limit was exceeded. Check your Gemini billing and quota.";
  }
  if (status === 400) {
    return "Gemini rejected the image-generation request. Check that GEMINI_IMAGE_MODEL supports image generation.";
  }
  if (typeof status === "number" && status >= 500) {
    return `Gemini image generation is temporarily unavailable (HTTP ${status}). Please retry later.`;
  }
  if (typeof status === "number") {
    return `Gemini rejected the image-generation request (HTTP ${status}). Check the configured model and API access.`;
  }
  return "Could not reach Gemini image generation. Check server network access and retry.";
}

export function imageGenerationResponseFailure(
  errors: Array<{ code?: string; message?: string }> | undefined,
): string {
  const detail = errors?.map((error) => `${error.code ?? ""} ${error.message ?? ""}`).join(" ") ?? "";
  if (/quota|rate.?limit/i.test(detail)) {
    return "Gemini image-generation quota or rate limit was exceeded. Check your Gemini billing and quota.";
  }
  if (/permission|unauthori[sz]ed|api.?key|forbidden/i.test(detail)) {
    return "Gemini rejected the image API key or this key does not have access to the configured image model.";
  }
  if (/not found|unknown model|unsupported model/i.test(detail)) {
    return "The configured Gemini image model is unavailable. Check GEMINI_IMAGE_MODEL and model access.";
  }
  if (/safety|blocked|policy/i.test(detail)) {
    return "Gemini blocked this image request. Adjust the story or scene description and retry.";
  }
  return "Gemini did not return an image. Check GEMINI_IMAGE_MODEL and model access, then retry.";
}
