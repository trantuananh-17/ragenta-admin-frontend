import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { speechOptions } from "../options/speech.options";

export async function prefetchSpeechSettings() {
  await getQueryClient().prefetchQuery(speechOptions.settings());
}
