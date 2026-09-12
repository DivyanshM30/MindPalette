import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') || '/'
  let redirectUrl = new URL('/', requestUrl.origin)
  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    try {
      // URL parsing normalizes backslashes and control characters, so a
      // leading slash alone does not guarantee a same-origin destination.
      const candidate = new URL(rawNext, requestUrl.origin)
      if (candidate.origin === requestUrl.origin) redirectUrl = candidate
    } catch {
      // Malformed destinations fall back to the dashboard.
    }
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
}

