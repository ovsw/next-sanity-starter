import { Mail } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

type OfficeHoursRow = {
  days?: string;
  hours?: string;
};

export function validateOfficeHours(
  rows: unknown[] | null | undefined,
): true | string {
  if (!rows?.length) {
    return "Add at least one office-hours row";
  }

  if (rows.length > 7) {
    return "Add no more than seven office-hours rows";
  }

  return rows.every((row) => {
    const item = row as OfficeHoursRow;
    return item.days?.trim() && item.hours?.trim();
  })
    ? true
    : "Every office-hours row needs both days and hours";
}

function inputCopyField({
  description,
  name,
  title,
}: {
  description: string;
  name: string;
  title: string;
}) {
  return defineField({
    name,
    title,
    type: "object",
    description,
    fields: [
      defineField({
        name: "label",
        type: "string",
        description: `The visible label for the ${title.toLowerCase()} field`,
        validation: (rule) => rule.required().max(40),
      }),
      defineField({
        name: "placeholder",
        type: "string",
        description: `The example text shown inside the ${title.toLowerCase()} field`,
        validation: (rule) => rule.required().max(120),
      }),
    ],
    validation: (rule) => rule.required(),
  });
}

export default defineType({
  name: "contactForm",
  title: "Contact Form",
  type: "object",
  icon: Mail,
  description:
    "A contact introduction with office hours and a visitor message form",
  fields: [
    defineField({
      name: "useCreamBackground",
      title: "Use Cream Background",
      type: "boolean",
      description:
        "Turn on to use a cream background for this section. Leave off for white.",
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
      description: "The main page heading introducing the contact pathway",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "The supporting message shown below the main heading",
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: "officeHoursTitle",
      title: "Office Hours Heading",
      type: "string",
      description: "The heading shown above the office-hours list",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "officeHours",
      type: "array",
      description: "The days and availability displayed to visitors",
      of: [
        defineArrayMember({
          name: "officeHoursRow",
          title: "Office Hours Row",
          type: "object",
          fields: [
            defineField({
              name: "days",
              type: "string",
              description: "The day or day range, such as Monday – Friday",
              validation: (rule) => rule.required().max(60),
            }),
            defineField({
              name: "hours",
              type: "string",
              description: "The hours or availability for these days",
              validation: (rule) => rule.required().max(60),
            }),
          ],
          preview: {
            select: { subtitle: "hours", title: "days" },
          },
        }),
      ],
      validation: (rule) => rule.required().custom(validateOfficeHours),
    }),
    defineField({
      name: "formTitle",
      title: "Form Heading",
      type: "string",
      description: "The heading shown at the top of the message form",
      validation: (rule) => rule.required().max(80),
    }),
    inputCopyField({
      name: "nameField",
      title: "Name",
      description: "The label and placeholder for the visitor's name",
    }),
    inputCopyField({
      name: "emailField",
      title: "Email",
      description: "The label and placeholder for the visitor's email address",
    }),
    inputCopyField({
      name: "phoneField",
      title: "Phone",
      description: "The label and placeholder for the visitor's phone number",
    }),
    inputCopyField({
      name: "messageField",
      title: "Message",
      description: "The label and placeholder for the visitor's message",
    }),
    defineField({
      name: "submitLabel",
      title: "Submit Button Label",
      type: "string",
      description: "The text shown on the form's submit button",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "privacyNote",
      type: "string",
      description: "The privacy reassurance shown beside the submit button",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "unavailableMessage",
      title: "Unavailable Submission Message",
      type: "text",
      rows: 2,
      description:
        "The message shown when a visitor tries to submit before online delivery is connected",
      validation: (rule) => rule.required().max(240),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      subtitle: "Contact Form",
      title: title || "Untitled Contact Form",
    }),
  },
});
