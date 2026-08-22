// documents
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import author from "./schemas/documents/author";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";
import navigation, {
  navigationSchemaTypes,
} from "./schemas/documents/navigation";
import settings from "./schemas/documents/settings";
import teamMember from "./schemas/documents/team-member";
import blogIndex from "./schemas/documents/blog-index";
import blogPostSettings from "./schemas/documents/blog-post-settings";
import homePage from "./schemas/documents/home-page";
import footer, { footerSchemaTypes } from "./schemas/documents/footer";
import redirect from "./schemas/documents/redirect";

// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import link from "./schemas/blocks/shared/link";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import sectionPadding from "./schemas/blocks/shared/section-padding";
import sectionNav from "./schemas/blocks/shared/section-nav";
import customUrl from "./schemas/blocks/shared/custom-url";
import customLink from "./schemas/blocks/shared/custom-link";
import button from "./schemas/blocks/shared/button";
import buttonLink from "./schemas/blocks/shared/button-link";
import richTextContent from "./schemas/blocks/shared/rich-text-content";
import simpleRichText from "./schemas/blocks/shared/simple-rich-text";
import {
  blogPostSidebar,
  blogPostSidebarAction,
} from "./schemas/blocks/shared/blog-post-sidebar";
// Schema UI objects
import hero1 from "./schemas/blocks/hero/hero-1";
import homeHero from "./schemas/blocks/home-hero";
import loanFeatureCards from "./schemas/blocks/loan-feature-cards";
import videoFeature from "./schemas/blocks/video-feature";
import phxEmbedSocialReviews from "./schemas/blocks/phx-embed-social-reviews";
import homebotWidget from "./schemas/blocks/homebot-widget";
import latestArticles from "./schemas/blocks/latest-articles";
import faqAccordion from "./schemas/blocks/faq-accordion";
import awardCta from "./schemas/blocks/award-cta";
import pageHeader from "./schemas/blocks/page-header";
import storyFeature from "./schemas/blocks/story-feature";
import bigVideoFeature from "./schemas/blocks/big-video-feature";
import editorialChapter from "./schemas/blocks/editorial-chapter";
import youtubeChannelFeature from "./schemas/blocks/youtube-channel-feature";
import personCta from "./schemas/blocks/person-cta";
import locationMap from "./schemas/blocks/location-map";
import personContactCta from "./schemas/blocks/person-contact-cta";
import contactForm from "./schemas/blocks/contact-form";
import teamMembers from "./schemas/blocks/team-members";
import richTextBlock from "./schemas/blocks/rich-text-block";
import advisorCta from "./schemas/blocks/advisor-cta";
import processSteps from "./schemas/blocks/process-steps";
import ctaBanner from "./schemas/blocks/cta-banner";
import benefitCards from "./schemas/blocks/benefit-cards";
import comparisonTable from "./schemas/blocks/comparison-table";
import loanRequirements from "./schemas/blocks/loan-requirements";

export const schemaTypes = [
  // documents
  page,
  post,
  author,
  category,
  faq,
  testimonial,
  navigation,
  ...navigationSchemaTypes,
  settings,
  teamMember,
  blogIndex,
  blogPostSettings,
  homePage,
  footer,
  redirect,
  ...footerSchemaTypes,
  // shared objects
  blockContent,
  link,
  colorVariant,
  buttonVariant,
  sectionPadding,
  sectionNav,
  customUrl,
  customLink,
  button,
  buttonLink,
  richTextContent,
  simpleRichText,
  blogPostSidebarAction,
  blogPostSidebar,
  // blocks
  hero1,
  homeHero,
  loanFeatureCards,
  videoFeature,
  phxEmbedSocialReviews,
  homebotWidget,
  latestArticles,
  faqAccordion,
  awardCta,
  pageHeader,
  storyFeature,
  bigVideoFeature,
  editorialChapter,
  youtubeChannelFeature,
  personCta,
  locationMap,
  personContactCta,
  contactForm,
  teamMembers,
  richTextBlock,
  advisorCta,
  processSteps,
  ctaBanner,
  benefitCards,
  comparisonTable,
  loanRequirements,
];
