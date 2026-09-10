import { Children, type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
// Shadcnblocks feature3. Omit optional media and icons when content has none.
export function FeatureGrid({
  title,
  id,
  titleAttribute,
  children,
}: {
  title: ReactNode;
  id: string;
  titleAttribute?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-32" aria-labelledby={id}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <h2
            className="mb-9 text-4xl font-semibold tracking-tight text-balance lg:mb-14 lg:text-5xl"
            id={id}
            data-sanity={titleAttribute}
          >
            {title}
          </h2>
          <div
            className={`grid w-full grid-cols-1 gap-6 sm:grid-cols-2 ${Children.count(children) > 2 ? "lg:grid-cols-3" : ""}`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
export function FeatureCard({
  title,
  body,
  icon,
  image,
  titleAttribute,
  bodyAttribute,
}: {
  title: ReactNode;
  body: ReactNode;
  icon?: ReactNode;
  image?: ReactNode;
  titleAttribute?: string;
  bodyAttribute?: string;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {icon ? <CardHeader className="pb-1">{icon}</CardHeader> : null}
      <CardContent className={`flex-1 text-left ${icon ? "" : "pt-6"}`}>
        <h3 className="mb-2 text-lg font-semibold" data-sanity={titleAttribute}>
          {title}
        </h3>
        <div
          className="space-y-4 leading-snug text-muted-foreground"
          data-sanity={bodyAttribute}
        >
          {body}
        </div>
      </CardContent>
      {image && (
        <CardFooter className="justify-end pr-0 pb-0">{image}</CardFooter>
      )}
    </Card>
  );
}
