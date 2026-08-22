import { at, defineMigration, patch, unset } from "sanity/migrate";

export default defineMigration({
  title: "Remove the legacy pageBuilder field from pages",
  documentTypes: ["page"],
  filter: "defined(pageBuilder)",
  async *migrate(documents) {
    for await (const document of documents()) {
      yield patch(
        document._id,
        at("pageBuilder", unset()),
        { ifRevision: document._rev },
      );
    }
  },
});
