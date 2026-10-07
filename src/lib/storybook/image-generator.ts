import "server-only";

import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import type { GeneratedImageSize } from "../types/storybook.ts";
import {
  imageGenerationRequestFailure,
  imageGenerationResponseFailure,
} from "./image-errors.ts";
import { isTrustedBlobUrl } from "./storage-url.ts";

const MAX_REFERENCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_GENERATED_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export class ImageGenerationConfigurationError extends Error {}
export class ImageStorageConfigurationError extends Error {}
export class ImageGenerationRequestError extends Error {}
export class ImageGenerationResponseError extends Error {}

interface ImageInput {
  url: string;
  label: string;
}

function geminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ImageGenerationConfigurationError("Set GEMINI_API_KEY on the server.");
  }
  return new GoogleGenAI({ apiKey });
}

async function loadReferenceImage(input: ImageInput): Promise<{
  data: string;
  mimeType: string;
}> {
  if (!isTrustedBlobUrl(input.url)) {
    throw new ImageGenerationResponseError(`${input.label} must be a generated Vercel Blob image URL.`);
  }

  let response: Response;
  try {
    response = await fetch(input.url, { redirect: "error" });
  } catch {
    throw new ImageGenerationRequestError(`Could not load the ${input.label} image reference.`);
  }
  if (!response.ok || !response.body) {
    throw new ImageGenerationRequestError(`Could not load the ${input.label} image reference.`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0].trim() || "";
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new ImageGenerationResponseError(`The ${input.label} reference is not a supported image.`);
  }
  const declaredSize = Number(response.headers.get("content-length") || "0");
  if (declaredSize > MAX_REFERENCE_IMAGE_BYTES) {
    throw new ImageGenerationResponseError(`The ${input.label} image reference is too large.`);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > MAX_REFERENCE_IMAGE_BYTES) {
        await reader.cancel();
        throw new ImageGenerationResponseError(`The ${input.label} image reference is too large.`);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ImageGenerationResponseError) throw error;
    throw new ImageGenerationRequestError(`Could not read the ${input.label} image reference.`);
  }

  const bytes = Buffer.concat(chunks);
  return { data: bytes.toString("base64"), mimeType };
}

export async function generateAndStoreImage(
  prompt: string,
  imageSize: GeneratedImageSize,
  references: ImageInput[] = [],
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ImageStorageConfigurationError(
      "Set BLOB_READ_WRITE_TOKEN to persist generated storybook images.",
    );
  }

  const ai = geminiClient();
  const imageParts = await Promise.all(references.map(loadReferenceImage));
  let interaction: Awaited<ReturnType<typeof ai.interactions.create>>;
  try {
    interaction = await ai.interactions.create({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1",
      input: [
        { type: "text", text: prompt },
        ...imageParts.map((image) => ({
          type: "image" as const,
          data: image.data,
          mime_type: image.mimeType,
        })),
      ],
      generation_config: {
        image_config: { aspect_ratio: "16:9", image_size: imageSize },
      },
    });
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    console.error("Gemini image-generation request failed.", {
      status: typeof status === "number" ? status : undefined,
    });
    throw new ImageGenerationRequestError(imageGenerationRequestFailure(error));
  }

  const image = interaction.output_image;
  if (!image?.data || !image.mime_type || !ALLOWED_IMAGE_TYPES.has(image.mime_type)) {
    throw new ImageGenerationResponseError(
      imageGenerationResponseFailure(interaction.errors),
    );
  }

  const bytes = Buffer.from(image.data, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_GENERATED_IMAGE_BYTES) {
    throw new ImageGenerationResponseError("The generated image had an invalid file size.");
  }

  const extension = image.mime_type === "image/jpeg" ? "jpg" : image.mime_type.split("/")[1];
  try {
    const blob = await put(
      `storybook/${randomUUID()}.${extension}`,
      bytes,
      {
        access: "public",
        contentType: image.mime_type,
        addRandomSuffix: false,
        allowOverwrite: false,
      },
    );
    return blob.url;
  } catch {
    throw new ImageStorageConfigurationError(
      "Could not save the generated image to Vercel Blob. Check BLOB_READ_WRITE_TOKEN and bucket access.",
    );
  }
}
