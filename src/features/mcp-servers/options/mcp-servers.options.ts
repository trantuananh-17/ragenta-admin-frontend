import { queryOptions } from "@tanstack/react-query";

import { getMcpServers } from "../service/mcp-servers.service";

export const mcpServerKeys = {
  all: () => ["mcp-servers"] as const,
};

export const mcpServerOptions = {
  list: () =>
    queryOptions({ queryKey: mcpServerKeys.all(), queryFn: getMcpServers }),
};
