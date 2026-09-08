"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-error";
import { mcpServerKeys, mcpServerOptions } from "../options/mcp-servers.options";
import {
  checkMcpServer,
  deleteMcpServer,
  saveMcpServer,
  type SaveMcpServerInput,
} from "../service/mcp-servers.service";

export function useMcpServersSuspense() {
  return useSuspenseQuery(mcpServerOptions.list());
}

export function useSaveMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveMcpServerInput) => saveMcpServer(input),
    onSuccess: async () => {
      toast.success("Saved.");
      await queryClient.invalidateQueries({ queryKey: mcpServerKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not save the server", {
        description: await errorMessage(error),
      });
    },
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => deleteMcpServer(serverId),
    onSuccess: async () => {
      toast.success("Server removed.");
      await queryClient.invalidateQueries({ queryKey: mcpServerKeys.all() });
    },
    onError: async (error) => {
      toast.error("Could not remove the server", {
        description: await errorMessage(error),
      });
    },
  });
}

/**
 * Ask a server what it offers.
 *
 * The outcome is recorded either way, so a failed check is not an error to
 * swallow — it is the answer, and the card shows the server's own refusal.
 */
export function useCheckMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => checkMcpServer(serverId),
    onSuccess: async (server) => {
      if (server.lastCheckOk) {
        toast.success(
          `${server.name} offers ${server.tools.length} ${server.tools.length === 1 ? "tool" : "tools"}.`,
        );
      } else {
        toast.error(`${server.name} did not answer`, {
          description: server.lastCheckError ?? undefined,
        });
      }
      await queryClient.invalidateQueries({ queryKey: mcpServerKeys.all() });
    },
    onError: async (error) => {
      toast.error("The check could not be made", {
        description: await errorMessage(error),
      });
    },
  });
}
