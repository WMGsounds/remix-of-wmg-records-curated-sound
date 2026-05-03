// Re-exports for backwards compatibility — use @/components/Seo for new work.
export { Seo as PageTitle } from "@/components/Seo";

const SITE_TITLE = "WMG Records | Wareham Music Group";
export const formatPageTitle = (title?: string) =>
  title ? `${title} | WMG Records` : SITE_TITLE;
