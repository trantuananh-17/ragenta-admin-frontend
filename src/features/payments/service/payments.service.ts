import { z } from "zod";

import { api } from "@/lib/ky";
import { pageSchema, toOffset } from "@/lib/pagination";

/**
 * `GET /v1/admin/payments` — money that changed hands, across every workspace.
 *
 * Distinct from the credit ledger and from usage: this is what was collected, in
 * dollars, and it is the only table in the product that records a payment at all.
 */
export const adminPaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  workspaceName: z.string(),
  kind: z.string(),
  status: z.string(),
  amountUsd: z.coerce.number(),
  currency: z.string(),
  description: z.string(),
  hostedInvoiceUrl: z.string().nullable(),
  periodStart: z.coerce.string().nullable(),
  periodEnd: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
});

export const paymentsPageSchema = pageSchema(adminPaymentSchema);

export type AdminPayment = z.infer<typeof adminPaymentSchema>;
export type PaymentsPage = z.infer<typeof paymentsPageSchema>;

export interface PaymentsParams {
  page: number;
  limit: number;
  /** Empty means every status, which is the default the screen opens on. */
  status: string;
}

export async function getPayments(params: PaymentsParams): Promise<PaymentsPage> {
  const searchParams: Record<string, string | number> = {
    limit: params.limit,
    offset: toOffset(params.page, params.limit),
  };
  if (params.status) searchParams.status = params.status;

  const response = await api.get("admin/payments", { searchParams });
  return paymentsPageSchema.parse(await response.json());
}
