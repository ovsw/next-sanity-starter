import { benefitCardsQuery } from "./benefit-cards";
import { ctaBannerQuery } from "./cta-banner";
import { faqAccordionQuery } from "./faq-accordion";
import { latestArticlesQuery } from "./latest-articles";
import { richTextBlockQuery } from "./rich-text-block";
import { storyFeatureQuery } from "./story-feature";
import { teamMembersQuery } from "./team-members";
import { heroQuery } from "./hero";
import { testimonialsQuery } from "./testimonials";
import { stackedFeatureRowsQuery } from "./stacked-feature-rows";
import { stackedTimelineQuery } from "./stacked-timeline";
// page-builder-generator:query-imports

export const pageBuilderQuery = `
  blocks[]{
    _key,
    _type,
    ${latestArticlesQuery},
    ${faqAccordionQuery},
    ${storyFeatureQuery},
    ${teamMembersQuery},
    ${richTextBlockQuery},
    ${ctaBannerQuery},
    ${benefitCardsQuery},
    ${heroQuery},
    ${testimonialsQuery},
    ${stackedFeatureRowsQuery},
    ${stackedTimelineQuery},
    ${"" /* page-builder-generator:query-spreads */}
  }
`;
