import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Entity Not Found</h1>
        <p className="text-gray-400 mb-6">The requested entity could not be found.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

