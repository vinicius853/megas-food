'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function LogsPage() {
  return (
    <div className="rounded-2xl border border-[#EAECEF] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF3C00]">
        <FileText className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-2xl font-black">Logs</h1>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#64748B]">
        Os logs operacionais estao conectados na auditoria real da plataforma.
      </p>
      <Link href="/master/auditoria" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-[#FF3C00] via-[#FF6A00] to-[#FFB000] px-5 py-3 text-sm font-black text-white">
        Abrir auditoria
      </Link>
    </div>
  )
}
