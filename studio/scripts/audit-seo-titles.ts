import { pathToFileURL } from "node:url";
import { getCliClient } from "sanity/cli";
import {
  createSeoTitleAuditRows,
  serializeSeoTitleAuditCsv,
  type SeoTitleAuditDocument,
} from "../../shared/seo-title-audit.ts";

const API_VERSION = "2026-08-16";
const ALLOWED_DATASETS = ["development", "production"];

function resolveDataset() {
  const flag = process.argv.find((argument) => argument.startsWith("--dataset="));
  const dataset = flag?.slice("--dataset=".length) || "development";
  if (!ALLOWED_DATASETS.includes(dataset)) {
    throw new Error(
      `Unknown dataset ${dataset}; use one of ${ALLOWED_DATASETS.join(", ")}`,
    );
  }
  return dataset;
}

async function main() {
  const dataset = resolveDataset();
  const client = getCliClient({
    apiVersion: API_VERSION,
    dataset,
    perspective: "published",
    useCdn: false,
  });
  if (client.config().dataset !== dataset) {
    throw new Error(`Refusing to read outside the ${dataset} dataset`);
  }

  const documents = await client.fetch<SeoTitleAuditDocument[]>(`
    *[_type in ["homePage", "page", "post", "blogIndex", "category"]]
      | order(_type asc, _id asc) {
        _id,
        _type,
        title,
        "slug": slug.current,
        "currentSeoTitle": meta.title
      }
  `);
  const rows = createSeoTitleAuditRows(documents);

  if (process.argv.includes("--format=csv")) {
    console.log(serializeSeoTitleAuditCsv(rows));
    return;
  }

  console.log(JSON.stringify({ dataset, count: rows.length, rows }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
