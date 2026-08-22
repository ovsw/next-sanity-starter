import type { PAGE_QUERY_RESULT } from "@/sanity.types";

export type ContactFormInputCopy = {
  label: string | null;
  placeholder: string | null;
};

export type ContactFormOfficeHoursRow = {
  _key: string;
  _type: "officeHoursRow";
  days: string | null;
  hours: string | null;
};

type LocalContactFormBlock = {
  _key: string;
  _type: "contactForm";
  useCreamBackground: boolean | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  officeHoursTitle: string | null;
  officeHours: ContactFormOfficeHoursRow[] | null;
  formTitle: string | null;
  nameField: ContactFormInputCopy | null;
  emailField: ContactFormInputCopy | null;
  phoneField: ContactFormInputCopy | null;
  messageField: ContactFormInputCopy | null;
  submitLabel: string | null;
  privacyNote: string | null;
  unavailableMessage: string | null;
};

type PageBlock = NonNullable<
  NonNullable<PAGE_QUERY_RESULT>["blocks"]
>[number];

type GeneratedContactFormBlock = Extract<PageBlock, { _type: "contactForm" }>;

export type ContactFormBlock = [GeneratedContactFormBlock] extends [never]
  ? LocalContactFormBlock
  : GeneratedContactFormBlock;

type FieldDataAttributes = {
  label?: string;
  placeholder?: string;
};

type OfficeHoursDataAttributes = {
  days?: string;
  hours?: string;
};

export type ContactFormDataAttributes = {
  description?: string;
  emailField?: FieldDataAttributes;
  eyebrow?: string;
  formTitle?: string;
  messageField?: FieldDataAttributes;
  nameField?: FieldDataAttributes;
  officeHours?: OfficeHoursDataAttributes[];
  officeHoursTitle?: string;
  phoneField?: FieldDataAttributes;
  privacyNote?: string;
  submitLabel?: string;
  title?: string;
  unavailableMessage?: string;
};
