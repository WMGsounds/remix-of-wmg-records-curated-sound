import { useEffect } from "react";

const SITE_TITLE = "WMG (Wareham Music Group)";

type PageTitleProps = {
  title?: string;
};

const setMetaContent = (selector: string, content: string) => {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) element.content = content;
};

export const formatPageTitle = (title?: string) => title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;

export const PageTitle = ({ title }: PageTitleProps) => {
  useEffect(() => {
    const pageTitle = formatPageTitle(title);
    document.title = pageTitle;
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[name="twitter:title"]', pageTitle);
  }, [title]);

  return null;
};
