// Shadcnblocks team1: centered introduction and avatar grid.
import PortableTextRenderer from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import { resolveSectionTheme, sectionSceneClassName, type SectionSceneProps } from "./section-boundaries";

type Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "teamMembers" }
> & {
  dataAttribute?: (path: string) => string | undefined;
  memberDataAttribute?: (id: string, path: string) => string | undefined;
} & SectionSceneProps;
export default function TeamMembers({
  _key,
  title,
  richText,
  members,
  dataAttribute,
  memberDataAttribute,
  bottom = "outer",
  top = "outer",
  theme,
}: Props) {
  const people = (members ?? []).flatMap((m) =>
    m.document ? [{ key: m._key, person: m.document }] : [],
  );
  if (!people.length) return null;
  const headingId = `team-members-${stegaClean(_key)}-title`;
  const hasTitle = Boolean(stegaClean(title)?.trim());
  return (
    <section
      className={sectionSceneClassName(resolveSectionTheme(theme), top, bottom)}
      data-sanity={dataAttribute?.("theme")}
      id="team"
      aria-labelledby={hasTitle ? headingId : undefined}
    >
      <div className="container flex flex-col items-center text-center">
        {hasTitle ? (
          <h2
            className="my-6 text-2xl font-bold text-pretty lg:text-4xl"
            id={headingId}
            data-sanity={dataAttribute?.("title")}
          >
            {title}
          </h2>
        ) : null}
        {richText?.length ? (
          <div
            className="mb-8 max-w-3xl text-muted-foreground lg:text-xl"
            data-sanity={dataAttribute?.("richText")}
          >
            <PortableTextRenderer value={richText} />
          </div>
        ) : null}
      </div>
      <div
        className={`container mt-16 grid gap-x-8 gap-y-16 ${people.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : ""}`}
        data-sanity={dataAttribute?.("members")}
      >
        {people.map(({ key, person }) => (
          <div key={key ?? person._id} className="flex flex-col items-center">
            {person.image?.asset?._id && (
              <Image
                className="mb-4 size-20 rounded-full border object-cover md:mb-5 lg:size-24"
                width={96}
                height={96}
                alt={stegaClean(person.image.alt) || ""}
                src={urlFor(person.image).width(192).height(192).url()}
                data-sanity={memberDataAttribute?.(person._id, "image")}
              />
            )}
            <h3
              className="text-center font-medium"
              data-sanity={memberDataAttribute?.(person._id, "name")}
            >
              {person.name}
            </h3>
            {stegaClean(person.role)?.trim() ? (
              <p
                className="text-center text-muted-foreground"
                data-sanity={memberDataAttribute?.(person._id, "role")}
              >
                {person.role}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
