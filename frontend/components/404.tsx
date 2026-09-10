import { PageHeading } from "@/components/shadcnblocks/page-heading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function Custom404() {
  return (
    <div className="min-h-[80vh]">
      <PageHeading
        title="Page not found"
        description="This page may have moved, or the address may be incorrect."
      />
      <div className="flex justify-center pb-24">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
