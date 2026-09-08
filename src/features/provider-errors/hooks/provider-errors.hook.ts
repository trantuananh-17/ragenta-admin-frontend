"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { providerErrorOptions } from "../options/provider-errors.options";
import type { ProviderErrorsParams } from "../service/provider-errors.service";

export function useProviderErrorsSuspense(params: ProviderErrorsParams) {
  return useSuspenseQuery(providerErrorOptions.range(params));
}
