import {
  createLoanJsonLd,
  serializeLoanJsonLd,
  type CreateLoanJsonLdOptions,
} from "@/lib/loan-json-ld";

export default function LoanJsonLd(props: CreateLoanJsonLdOptions) {
  const value = createLoanJsonLd(props);
  if (!value) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeLoanJsonLd(value) }}
      type="application/ld+json"
    />
  );
}
