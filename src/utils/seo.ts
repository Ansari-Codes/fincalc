import { siteConfig } from '../config/site'

export interface SeoMeta {
  title?: string
  description?: string
  canonical?: string
  path?: string
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

export function updatePageSeo(meta: SeoMeta) {
  const fullTitle = meta.title 
    ? `${meta.title} | ${siteConfig.name}`
    : `${siteConfig.name} – ${siteConfig.tagline}`

  document.title = fullTitle

  // Meta description
  const description = meta.description || siteConfig.description
  let descTag = document.querySelector('meta[name="description"]')
  if (!descTag) {
    descTag = document.createElement('meta')
    descTag.setAttribute('name', 'description')
    document.head.appendChild(descTag)
  }
  descTag.setAttribute('content', description)

  // Canonical URL
  const canonicalUrl = meta.canonical 
    ? meta.canonical 
    : meta.path 
      ? `${siteConfig.url}${meta.path}` 
      : window.location.href.split('?')[0]

  let canonicalTag = document.querySelector('link[rel="canonical"]')
  if (!canonicalTag) {
    canonicalTag = document.createElement('link')
    canonicalTag.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalTag)
  }
  canonicalTag.setAttribute('href', canonicalUrl)

  // Open Graph Tags
  setMetaTag('property', 'og:title', fullTitle)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:url', canonicalUrl)
  setMetaTag('property', 'og:site_name', siteConfig.name)
  setMetaTag('property', 'og:type', meta.path && meta.path.startsWith('/learn/') && meta.path !== '/learn/' ? 'article' : 'website')

  // Twitter Card Tags
  setMetaTag('name', 'twitter:card', 'summary')
  setMetaTag('name', 'twitter:title', fullTitle)
  setMetaTag('name', 'twitter:description', description)

  // Structured Data (JSON-LD)
  if (meta.jsonLd) {
    let scriptTag = document.querySelector('script[data-seo="json-ld"]')
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.setAttribute('type', 'application/ld+json')
      scriptTag.setAttribute('data-seo', 'json-ld')
      document.head.appendChild(scriptTag)
    }
    scriptTag.textContent = JSON.stringify(meta.jsonLd)
  }
}

function setMetaTag(attrName: string, attrVal: string, content: string) {
  let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrVal)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
