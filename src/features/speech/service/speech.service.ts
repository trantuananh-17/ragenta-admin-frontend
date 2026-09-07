import { z } from "zod";

import { api } from "@/lib/ky";

/**
 * `/v1/admin/speech` — transcription and synthesis.
 *
 * Kept apart from the model providers even though it is also "an AI vendor's
 * key". Those are the models Ragenta runs a conversation on; these are two
 * endpoints that turn audio into words and words into audio, bought separately
 * and often from different places — a gateway for transcription, a self-hosted
 * container for a Vietnamese voice. One of the two being configured without the
 * other is the ordinary state, not a half-finished one.
 */
export const SPEECH_CAPABILITIES = ["stt", "tts"] as const;
export type SpeechCapability = (typeof SPEECH_CAPABILITIES)[number];

export const speechEndpointSchema = z.object({
  configured: z.boolean(),
  /** Which of the two sources won: the console's own row, or the deployment's env. */
  source: z.enum(["database", "environment"]).nullable(),
  baseUrl: z.string().nullable(),
  model: z.string().nullable(),
  voice: z.string().nullable(),
  /** Masked. The key itself is never returned by the API. */
  keyHint: z.string().nullable(),
});

export const speechSettingsSchema = z.object({
  /** False means no key can be stored at all; the deployment has no encryption key. */
  encryptionConfigured: z.boolean(),
  stt: speechEndpointSchema,
  tts: speechEndpointSchema,
});

export type SpeechEndpoint = z.infer<typeof speechEndpointSchema>;
export type SpeechSettings = z.infer<typeof speechSettingsSchema>;

export interface SaveSpeechEndpointInput {
  baseUrl: string;
  /** Omitted keeps the stored key, so changing a model is not a rotation. */
  apiKey?: string;
  model: string;
  voice?: string | null;
}

export async function getSpeechSettings(): Promise<SpeechSettings> {
  const response = await api.get("admin/speech");
  return speechSettingsSchema.parse(await response.json());
}

export async function saveSpeechEndpoint(
  capability: SpeechCapability,
  input: SaveSpeechEndpointInput,
): Promise<SpeechSettings> {
  const response = await api.put(`admin/speech/${capability}`, {
    json: {
      baseUrl: input.baseUrl,
      ...(input.apiKey ? { apiKey: input.apiKey } : {}),
      model: input.model,
      voice: input.voice ?? null,
    },
  });
  return speechSettingsSchema.parse(await response.json());
}

export async function clearSpeechEndpoint(
  capability: SpeechCapability,
): Promise<SpeechSettings> {
  const response = await api.delete(`admin/speech/${capability}`);
  return speechSettingsSchema.parse(await response.json());
}

export const speechCheckSchema = z.object({
  ok: z.boolean(),
  detail: z.string().optional(),
});

export async function checkSpeechEndpoint(capability: SpeechCapability) {
  const response = await api.post(`admin/speech/${capability}/check`);
  return speechCheckSchema.parse(await response.json());
}
