'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import HtmlOverlay from '@/components/HtmlOverlay'
import { supabase } from '@/lib/supabase'

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [scrollT, setScrollT] = useState(0)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Auto-redirect logged-in users to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setScrollT(Math.min(1, Math.max(0, window.scrollY / scrollable)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Don't flash the landing page while checking session
  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#04060a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(74,124,89,0.2)', borderTopColor: '#6adc89', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ height: '500vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <Scene scrollT={scrollT} />
        <HtmlOverlay scrollT={scrollT} />
      </div>
    </div>
  )
}
