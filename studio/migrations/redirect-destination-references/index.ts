import {
  at,
  defineMigration,
  patch,
  set,
} from "sanity/migrate";
import type { SanityDocument } from "sanity";

import { getPresentationPath } from "../../presentation/routes.ts";
import {
  normalizeRedirectPath,
  readRedirectPath,
  type RedirectRecord,
} from "../../schemas/validation/redirect-rules.ts";

type RoutedDocument = {
  _id: string;
  _type: string;
  slug?: { current?: string };
};

type RedirectDocument = SanityDocument & RedirectRecord;

export type DestinationReferencePlan =
  | { status: "already-migrated" }
  | { referenceId: string; status: "migrate" }
  | { reason: string; status: "fatal" };

function routePath(document: RoutedDocument) {
  return getPresentationPath(document._type, document.slug?.current);
}

export function planDestinationReference(
  redirect: RedirectRecord,
  routedDocuments: RoutedDocument[],
): DestinationReferencePlan {
  if (redirect.destinationReference?._ref) {
    return { status: "already-migrated" };
  }

  const destination = normalizeRedirectPath(
    readRedirectPath(redirect.destination),
  );
  if (!destination) {
    return { status: "fatal", reason: "missing legacy destination path" };
  }

  const matches = routedDocuments.filter(
    (document) => normalizeRedirectPath(routePath(document)) === destination,
  );
  if (matches.length === 0) {
    return {
      status: "fatal",
      reason: `no published page owns ${destination}`,
    };
  }
  if (matches.length > 1) {
    return {
      status: "fatal",
      reason: `${matches.length} published pages own ${destination}: ${matches
        .map((document) => document._id)
        .join(", ")}`,
    };
  }

  return {
    status: "migrate",
    referenceId: matches[0]._id.replace(/^drafts\./, ""),
  };
}

export default defineMigration({
  title: "Convert redirect destinations to strong page references",
  documentTypes: ["redirect"],
  async *migrate(documents, context) {
    const routedDocuments = await context.client.fetch<RoutedDocument[]>(/* groq */ `
      *[
        _type in ["page", "post", "category", "homePage", "blogIndex"] &&
        !(_id in path("drafts.**")) &&
        !(_id in path("versions.**")) &&
        (_type in ["homePage", "blogIndex"] || defined(slug.current))
      ]{
        _id,
        _type,
        slug
      }
    `);

    const redirects: RedirectDocument[] = [];
    for await (const document of documents()) {
      redirects.push(document as RedirectDocument);
    }

    const plans = redirects.map((redirect) => ({
      redirect,
      plan: planDestinationReference(redirect, routedDocuments),
    }));
    const fatal = plans.flatMap(({ redirect, plan }) =>
      plan.status === "fatal"
        ? [`Redirect ${redirect._id}: ${plan.reason}`]
        : [],
    );
    if (fatal.length > 0) {
      throw new Error(
        `Aborting before writes: ${fatal.length} redirect destination issue(s)\n${fatal.join("\n")}`,
      );
    }

    for (const { redirect, plan } of plans) {
      if (plan.status !== "migrate") continue;

      yield patch(
        redirect._id,
        at(
          "destinationReference",
          set({ _type: "reference", _ref: plan.referenceId }),
        ),
        { ifRevision: redirect._rev },
      );
    }
  },
});
