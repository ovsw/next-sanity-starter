import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const contactFormQuery = groq`
  _type == "contactForm" => {
    useCreamBackground,
    eyebrow,
    title,
    description,
    officeHoursTitle,
    officeHours[]{
      _key,
      _type,
      days,
      hours
    },
    formTitle,
    nameField {
      label,
      placeholder
    },
    emailField {
      label,
      placeholder
    },
    phoneField {
      label,
      placeholder
    },
    messageField {
      label,
      placeholder
    },
    submitLabel,
    privacyNote,
    unavailableMessage
  }
`;
