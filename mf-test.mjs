import { Miniflare } from "miniflare";
import fs from "fs";

async function run() {
  const mf = new Miniflare({
    modules: true,
    scriptPath: "dist/rkn-erp-core.js", // We'll see if dist exists
    d1Databases: ["rkn_erp_db_prod"],
    d1Persist: ".wrangler/state/v3/d1",
    durableObjects: {
      RknErpCore: "RknErpCore"
    },
    durableObjectsPersist: ".wrangler/state/v3/do"
  });
}
