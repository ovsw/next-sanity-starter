import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Message sent",
};

export default function ContactThanksPage() {
  return (
    <section className="section-pad surface-white">
      <div className="container max-w-3xl">
        <p className="mb-3.5 typo-eyebrow text-primary">Message sent</p>
        <h1 className="text-balance typo-page-heading text-foreground">
          Thanks for reaching out.
        </h1>
        <p className="mt-5 max-w-xl text-pretty typo-lead text-muted-foreground">
          Jimmy and his team typically respond the same business day.
        </p>
        <Button asChild className="mt-8">
          <Link href="/contact/">Back to contact</Link>
        </Button>
      </div>
    </section>
  );
}
