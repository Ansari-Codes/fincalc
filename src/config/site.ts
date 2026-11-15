export interface SiteConfig {
  name: string
  tagline: string
  description: string
  promise: string
  url: string
  contactEmail: string
  disclaimerShort: string
}

export const siteConfig: SiteConfig = {
  name: 'Financial Tools',
  tagline: 'Make sense of your money with practical financial tools.',
  description: 'Calculate returns, estimate costs, compare scenarios, and plan ahead with simple tools built to make financial questions easier to understand.',
  promise: 'Clear financial calculations. Practical tools. No account required.',
  url: 'https://kitaaab.org',
  contactEmail: 'contact@financialtools.local',
  disclaimerShort: 'Tools provide estimates for educational purposes. Review the assumptions before relying on a result.'
}
