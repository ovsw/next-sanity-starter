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
import settings, {
  settingsSchemaTypes,
} from "./schemas/documents/settings";
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
import hero from "./schemas/blocks/hero";
import hero1 from "./schemas/blocks/hero/hero-1";
import latestArticles from "./schemas/blocks/latest-articles";
import faqAccordion from "./schemas/blocks/faq-accordion";
import storyFeature from "./schemas/blocks/story-feature";
import teamMembers from "./schemas/blocks/team-members";
import richTextBlock from "./schemas/blocks/rich-text-block";
import ctaBanner from "./schemas/blocks/cta-banner";
import benefitCards from "./schemas/blocks/benefit-cards";

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
  ...settingsSchemaTypes,
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
  customUrl,
  customLink,
  button,
  buttonLink,
  richTextContent,
  simpleRichText,
  blogPostSidebarAction,
  blogPostSidebar,
  // blocks
  hero,
  hero1,
  latestArticles,
  faqAccordion,
  storyFeature,
  teamMembers,
  richTextBlock,
  ctaBanner,
  benefitCards,
];
