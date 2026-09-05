"use client";

import { useState } from "react";
import { MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeletePromoCode,
  useSetPromoCodeActive,
} from "../hooks/promo-codes.hook";
import type { PromoCode } from "../service/promo-codes.service";

export function PromoCodeRowActions({ promoCode }: { promoCode: PromoCode }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const setActive = useSetPromoCodeActive();
  const remove = useDeletePromoCode();

  const redeemed = promoCode.redeemedCount > 0;
  const busy = setActive.isPending || remove.isPending;

  return (
    <div onClick={(event) => event.stopPropagation()} role="presentation">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            aria-label={`Actions for ${promoCode.code}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              setActive.mutate({
                id: promoCode.id,
                active: !promoCode.active,
              })
            }
          >
            {promoCode.active ? (
              <>
                <PowerOff className="size-4" />
                Set inactive
              </>
            ) : (
              <>
                <Power className="size-4" />
                Set active
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={redeemed}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete ${promoCode.code}?`}
        description="The code disappears and can be created again by anyone. Credits already granted by it stay where they are. Set it inactive instead if you only want to stop new redemptions."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(promoCode.id, {
            onSuccess: () => setConfirmingDelete(false),
          })
        }
      />
    </div>
  );
}
