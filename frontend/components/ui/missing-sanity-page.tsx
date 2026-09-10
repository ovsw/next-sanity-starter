import { PageHeading } from "@/components/shadcnblocks/page-heading";
export default function MissingSanityPage({
  document,
  documentId,
}: {
  document: string;
  documentId: string;
}) {
  return (
    <PageHeading
      title={`${document} is not available`}
      description={`Add the ${documentId} document in Sanity Studio to preview this page.`}
    />
  );
}
