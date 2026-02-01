/**
 * Generate a CUID (Collision-resistant Unique Identifier)
 * Simple implementation compatible with Prisma's cuid()
 */
export function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart1 = Math.random().toString(36).substring(2, 8)
  const randomPart2 = Math.random().toString(36).substring(2, 8)
  const counter = Math.floor(Math.random() * 1000000).toString(36)
  
  return `c${timestamp}${randomPart1}${randomPart2}${counter}`
}

