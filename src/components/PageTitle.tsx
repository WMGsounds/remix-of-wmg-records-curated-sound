// Re-exports for backwards compatibility — use @/components/Seo for new work.
export { Seo as PageTitle } from "@/components/Seo";

const SITE_TITLE = "WMG | Wareham Music Group";
export const formatPageTitle = (title?: string) =>
  title ? `WMG | ${title}` : SITE_TITLE;
