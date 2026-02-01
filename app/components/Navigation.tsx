'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/calculator/rights-issue', label: 'Kalkulator Rights Issue' },
  { href: '/risk-management', label: 'Risk Management' },
  { href: '/calculator', label: 'Financial Ratio Calculator' },
]

export function Navigation() {
  const pathname = usePathname()

  // Short labels for mobile
  const getShortLabel = (label: string): string => {
    const shortLabels: Record<string, string> = {
      'Dashboard': 'Home',
      'Kalkulator Rights Issue': 'Rights Issue',
      'Risk Management': 'Risk',
      'Financial Ratio Calculator': 'Ratio',
    }
    return shortLabels[label] || label
  }

  return (
    <nav className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex items-center gap-1 sm:gap-1 min-w-max sm:min-w-0">
        {navItems.map((item) => {
          const isActive = (() => {
            // Exact match always wins
            if (pathname === item.href) return true
            
            // For sub-routes, only match if no more specific item matches
            if (item.href !== '/' && pathname?.startsWith(item.href + '/')) {
              // Check if there's a more specific item that also matches
              const moreSpecificMatch = navItems.some(otherItem => 
                otherItem.href !== item.href &&
                otherItem.href.length > item.href.length &&
                pathname?.startsWith(otherItem.href)
              )
              return !moreSpecificMatch
            }
            
            return false
          })()
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 sm:px-3 py-2 min-h-[44px] flex items-center text-xs sm:text-sm rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={item.label}
            >
              <span className="sm:hidden">{getShortLabel(item.label)}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

