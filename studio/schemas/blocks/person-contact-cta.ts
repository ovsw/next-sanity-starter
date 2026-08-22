import { ContactRound } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

type PersonContactMethodValue = {
  href?: string;
  type?: "address" | "email" | "phone";
};

export function validatePersonContactMethod(
  method: PersonContactMethodValue | null | undefined,
): true | string {
  if (!(method?.href && method.type)) return true;

  const expectedScheme = {
    address: "https:",
    email: "mailto:",
    phone: "tel:",
  }[method.type];

  return method.href.startsWith(expectedScheme)
    ? true
    : `${method.type[0]?.toUpperCase()}${method.type.slice(1)} methods must use a ${expectedScheme} destination`;
}

const personContactMethod = defineArrayMember({
  name: "personContactMethod",
  title: "Contact Method",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "Method",
      type: "string",
      description: "How visitors will contact or locate this person",
      options: {
        layout: "radio",
        list: [
          { title: "Phone", value: "phone" },
          { title: "Email", value: "email" },
          { title: "Address", value: "address" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Displayed Text",
      type: "text",
      rows: 2,
      description:
        "The phone number, email address, or street address visitors see",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "href",
      title: "Destination",
      type: "url",
      description:
        "The phone, email, or map link opened when this method is selected",
      validation: (rule) =>
        rule
          .required()
          .uri({ allowRelative: false, scheme: ["https", "tel", "mailto"] }),
    }),
  ],
  preview: {
    select: { subtitle: "type", title: "label" },
  },
  validation: (rule) => rule.custom(validatePersonContactMethod),
});

export default defineType({
  name: "personContactCta",
  title: "Person Contact CTA",
  type: "object",
  icon: ContactRound,
  description: "Direct contact pathways presented beside a person's portrait",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description: "Turn on to use a cream background for this section. Leave off for white.",
      initialValue: false,
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: "The short uppercase label shown above the main heading",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "The main heading introducing the person's contact details",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "contactMethods",
      title: "Contact Methods",
      type: "array",
      description:
        "One to four ways visitors can contact or locate this person",
      of: [personContactMethod],
      validation: (rule) => rule.required().min(1).max(4),
    }),
    defineField({
      name: "credentialLine",
      title: "Credential Line",
      type: "string",
      description:
        "Optional role, organization, or license details shown below the contact methods",
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "personImage",
      title: "Person Image",
      type: "image",
      description:
        "The editable person portrait. Use a transparent image so the fixed background shape remains visible.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
          description: "Describe the person for visitors using screen readers",
          validation: (rule) =>
            rule.custom((value, context) => {
              const image = context.parent as { asset?: unknown } | undefined;
              return image?.asset && !value?.trim()
                ? "Alternative text is required when a person image is set"
                : true;
            }),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { media: "personImage", title: "title" },
    prepare: ({ media, title }) => ({
      media,
      subtitle: "Person Contact CTA",
      title: title || "Untitled Person Contact CTA",
    }),
  },
});
