import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(async ({ name, value, options }) =>
              (await cookieStore).set(name, value, options)
            )
          } catch (error) {
            // The `cookies().set()` implementation in Next.js
            // may not be available during a Server Action
            // or Route Handler.
            // If you want to support logging in, you may need to
            // implement a dedicated Auth Callback Route
          }
        },
      },
    }
  )
}
