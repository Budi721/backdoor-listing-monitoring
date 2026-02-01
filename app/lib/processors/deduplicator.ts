import { db } from '@/lib/db'

/**
 * Checks if an announcement URL already exists in the database
 */
export async function isDuplicate(url: string): Promise<boolean> {
  const { data: existing } = await db
    .from('Announcement')
    .select('id')
    .eq('url', url)
    .single()
  return !!existing
}

/**
 * Batch check for duplicates
 */
export async function findDuplicates(urls: string[]): Promise<Set<string>> {
  const duplicates = new Set<string>()
  
  // Check in batches to avoid too many queries
  const batchSize = 50
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const { data: existing } = await db
      .from('Announcement')
      .select('url')
      .in('url', batch)
    
    if (existing) {
      existing.forEach((item: any) => duplicates.add(item.url))
    }
  }
  
  return duplicates
}

