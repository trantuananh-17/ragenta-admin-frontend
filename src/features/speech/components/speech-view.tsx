"use client";

import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpeechSettingsSuspense } from "../hooks/speech.hook";
import type { SpeechEndpoint } from "../service/speech.service";
import { SpeechEndpointCard } from "./speech-endpoint-card";

/**
 * Transcription and synthesis, configured here rather than in a file on the VM.
 *
 * Two cards rather than one form because the two halves are genuinely separate
 * purchases: a deployment can transcribe through a gateway and speak through a
 * self-hosted Vietnamese voice, and having one configured without the other is
 * the ordinary state rather than a half-finished one.
 */
/**
 * What the form should show once the server has answered differently — after a
 * save, or after a clear that fell back to the environment.
 *
 * Used as the card's `key` so a changed answer remounts it and the fields seed
 * themselves from the new values. That is React's own way of resetting state on
 * a prop change; copying each field into state from an effect would re-render
 * twice and briefly show the previous configuration as if it were current.
 */
function seed(endpoint: SpeechEndpoint, capability: string): string {
  return [capability, endpoint.source, endpoint.baseUrl, endpoint.model, endpoint.voice].join(
    "|",
  );
}

export function SpeechView() {
  const { data } = useSpeechSettingsSuspense();

  return (
    <>
      <PageHeader
        title="Speech"
        description="Where recordings are turned into words, and words into audio. Both halves speak the OpenAI audio API, so either can point at a hosted gateway or a container running on this network."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SpeechEndpointCard
          key={seed(data.stt, "stt")}
          capability="stt"
          title="Transcription"
          description="Voice notes in chat, and the transcribe step in an agent flow."
          endpoint={data.stt}
          encryptionConfigured={data.encryptionConfigured}
        />
        <SpeechEndpointCard
          key={seed(data.tts, "tts")}
          capability="tts"
          title="Synthesis"
          description="Read aloud in chat, and the speak step in an agent flow."
          endpoint={data.tts}
          encryptionConfigured={data.encryptionConfigured}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        With a half switched off, the feature behind it disappears from the
        customer app rather than failing: the microphone is not offered, and no
        answer carries a read-aloud button.
      </p>
    </>
  );
}

export function SpeechLoading() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {[0, 1].map((card) => (
        <Skeleton key={card} className="h-80 rounded-lg" />
      ))}
    </div>
  );
}

export function SpeechError() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
      Speech settings could not be loaded.
    </div>
  );
}
