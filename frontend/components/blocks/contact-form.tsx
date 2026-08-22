import ContactFormClient from "@/components/blocks/contact-form-client";
import type {
  ContactFormBlock,
  ContactFormDataAttributes,
} from "@/components/blocks/contact-form.types";

type ContactFormProps = ContactFormBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

function getDataAttributes(
  dataAttribute: ContactFormProps["dataAttribute"],
  officeHours: ContactFormBlock["officeHours"],
): ContactFormDataAttributes | undefined {
  if (!dataAttribute) return undefined;

  return {
    description: dataAttribute("description"),
    emailField: {
      label: dataAttribute("emailField.label"),
      placeholder: dataAttribute("emailField.placeholder"),
    },
    eyebrow: dataAttribute("eyebrow"),
    formTitle: dataAttribute("formTitle"),
    messageField: {
      label: dataAttribute("messageField.label"),
      placeholder: dataAttribute("messageField.placeholder"),
    },
    nameField: {
      label: dataAttribute("nameField.label"),
      placeholder: dataAttribute("nameField.placeholder"),
    },
    officeHours: officeHours?.map((row, index) => {
      const rowPath = row._key
        ? `officeHours[_key=="${row._key}"]`
        : `officeHours[${index}]`;

      return {
        days: dataAttribute(`${rowPath}.days`),
        hours: dataAttribute(`${rowPath}.hours`),
      };
    }),
    officeHoursTitle: dataAttribute("officeHoursTitle"),
    phoneField: {
      label: dataAttribute("phoneField.label"),
      placeholder: dataAttribute("phoneField.placeholder"),
    },
    privacyNote: dataAttribute("privacyNote"),
    submitLabel: dataAttribute("submitLabel"),
    title: dataAttribute("title"),
    unavailableMessage: dataAttribute("unavailableMessage"),
  };
}

export default function ContactForm({
  dataAttribute,
  ...block
}: ContactFormProps) {
  return (
    <ContactFormClient
      {...block}
      dataAttributes={getDataAttributes(dataAttribute, block.officeHours)}
    />
  );
}
