import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: [
      'https://www.hackwire.news/sitemap.xml',
      'https://www.hackwire.news/news-sitemap.xml',
    ],
  }
}
