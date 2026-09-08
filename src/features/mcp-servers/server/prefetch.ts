import "server-only";

import { getQueryClient } from "@/lib/get-query-client";
import { mcpServerOptions } from "../options/mcp-servers.options";

export async function prefetchMcpServers() {
  await getQueryClient().prefetchQuery(mcpServerOptions.list());
}
