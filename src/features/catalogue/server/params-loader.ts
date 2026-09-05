import { createLoader } from "nuqs/server";

import { catalogueParams, type CatalogueParams } from "../params";

export const catalogueParamsLoader = createLoader(catalogueParams);

export type { CatalogueParams };
