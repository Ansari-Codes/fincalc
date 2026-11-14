import { siteConfig } from '../config/site.ts'
import type { ToolItem } from '../data/tools.ts'
import type { ArticleItem } from '../data/articles.ts'

export function generateWebsiteSchema() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteConfig.name,
      'url': siteConfig.url,
      'description': siteConfig.description,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteConfig.url}/tools/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': siteConfig.name,
      'url': siteConfig.url,
      'description': siteConfig.description
    }
  ]
}

export function generateCalculatorSchema(tool: ToolItem) {
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': tool.name,
      'headline': tool.title,
      'description': tool.fullDescription,
      'url': `${siteConfig.url}${tool.path}`,
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Any (Web Browser)',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      }
    }
  ]

  if (tool.faqs && tool.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': tool.faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    })
  }

  return schemas
}

export function generateArticleSchema(article: ArticleItem) {
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'description': article.metaDescription,
      'url': `${siteConfig.url}${article.path}`,
      'datePublished': '2026-11-14T00:00:00Z',
      'dateModified': '2026-11-14T00:00:00Z',
      'author': {
        '@type': 'Organization',
        'name': siteConfig.name,
        'url': siteConfig.url
      },
      'publisher': {
        '@type': 'Organization',
        'name': siteConfig.name,
        'url': siteConfig.url
      }
    }
  ]

  if (article.faqs && article.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': article.faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    })
  }

  return schemas
}
