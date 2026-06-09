import { SITE_CONFIG } from "@/lib/constants"

export const siteConfig = {
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  ogImage: `${SITE_CONFIG.url}/og.png`,
  links: SITE_CONFIG.links,
}

export type SiteConfig = typeof siteConfig
