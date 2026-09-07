import { queryOptions } from "@tanstack/react-query";

import { getSpeechSettings } from "../service/speech.service";

export const speechKeys = {
  all: () => ["speech"] as const,
  settings: () => [...speechKeys.all(), "settings"] as const,
};

export const speechOptions = {
  settings: () =>
    queryOptions({
      queryKey: speechKeys.settings(),
      queryFn: () => getSpeechSettings(),
    }),
};
