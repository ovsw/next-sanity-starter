import { richTextBlockQuery } from "./rich-text-block";
import { scaffoldQuery } from "./scaffold";
// page-builder-generator:query-imports

export const pageBuilderQuery = `
  blocks[]{
    _key,
    _type,
    ${richTextBlockQuery},
    ${scaffoldQuery},
    ${"" /* page-builder-generator:query-spreads */}
  }
`;
