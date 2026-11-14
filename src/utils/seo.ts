import { siteConfig } from '../config/site'

export interface SeoMeta {
  title?: string
  description?: string
  canonical?: string
}

export function updatePageSeo(meta: SeoMeta) {
  const fullTitle = meta.title 
    ? `${meta.title} | ${siteConfig.name}`
    : `${siteConfig.name} – ${siteConfig.tagline}`

  document.title = fullTitle

  // Update meta description
  let descTag = document.querySelector('meta[name="description"]')
  if (!descTag) {
    descTag = document.createElement('meta')
    descTag.setAttribute('name', 'description')
    document.head.appendChild(descTag)
  }
  descTag.setAttribute('content', meta.description || siteConfig.description)

  // Update canonical
  let canonicalTag = document.querySelector('link[rel="canonical"]')
  if (!canonicalTag) {
    canonicalTag = document.createElement('link')
    canonicalTag.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalTag)
  }
  canonicalTag.setAttribute('href', meta.canonical || window.location.href)
}
