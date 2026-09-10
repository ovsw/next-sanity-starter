import {
  FeatureGrid,
  FeatureCard,
} from "@/components/shadcnblocks/feature-grid";
import { NavigationIcon } from "@/components/header/navigation-icon";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
type Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "benefitCards" }
> & { dataAttribute?: (path: string) => string | undefined };
export default function BenefitCards({
  _key,
  title,
  cards,
  dataAttribute,
}: Props) {
  if (!cards?.length) return null;
  return (
    <FeatureGrid
      title={title}
      id={`benefit-cards-${stegaClean(_key)}`}
      titleAttribute={dataAttribute?.("title")}
    >
      {cards.map((card) => {
        const path = `cards[_key=="${card._key}"]`;
        const name = stegaClean(card.icon?.name)?.trim();
        const svg = stegaClean(card.icon?.svg)?.trim();
        return (
          <FeatureCard
            key={card._key}
            title={card.title}
            titleAttribute={dataAttribute?.(`${path}.title`)}
            bodyAttribute={dataAttribute?.(`${path}.body`)}
            icon={name && svg ? <NavigationIcon icon={{ name, svg }} /> : null}
            body={
              card.body?.length ? (
                <PortableText
                  components={simpleRichTextComponents}
                  value={card.body}
                />
              ) : null
            }
            image={
              card.image?.asset?._id ? (
                <Image
                  className="aspect-4/3 w-full rounded-tl-md object-cover object-top"
                  width={600}
                  height={450}
                  src={urlFor(card.image).width(600).height(450).url()}
                  alt={stegaClean(card.image.alt) || ""}
                  data-sanity={dataAttribute?.(`${path}.image`)}
                />
              ) : null
            }
          />
        );
      })}
    </FeatureGrid>
  );
}
