import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// define public routes
const isPublicRoute = createRouteMatcher([
  '/',                    // home/feed
  '/sign-in(.*)',          // sign in and all sub-routes (simplified pattern)
  'sign-up(.*)',          // sign up and all sub-routes (simplified pattern)
  '/api/artworks/liked',  // public API for fetching likes
  '/api/sync',           // your existing sync route
]);

// We use clerkMiddleware as the default export, passing it an async function.
export default clerkMiddleware(async (auth, request: NextRequest) => {
  console.log("clerk middleware is running")

  // get the clerk_id from the auth() function
  const { userId } = await auth()
  
  if (!isPublicRoute(request)) {
    console.error('Error: userId not found');
    await auth.protect()
  }

  // Create the response object early so we can modify cookies
  const response = NextResponse.next();

  // Create a user-specific cookie name - this ensures that if multiple users login
  // on the same device they won't share the same cookie
  const cookieName = `userValidatedInDatabase_${userId}`;
  const existingValidation = request.cookies.get(cookieName);
  console.log('cookie', existingValidation)

  // Only perform database check if we don't have a valid cookie
  if (!existingValidation && 
      !request.nextUrl.pathname.startsWith('/api/sync') && 
      !request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    
    try {
      // Use an absolute URL for the API route
      const apiUrl = `${request.nextUrl.origin}/api/sync`;
      const syncResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (syncResponse.ok) {
        // Set cookie with validation result
        response.cookies.set({
          name: cookieName,
          value: JSON.stringify({
            isValid: true,
            timestamp: Date.now(),
          }),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        // Log the cookie modification
        console.log('Cookie set:', response.cookies.get(cookieName));
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      // Optionally set a cookie indicating sync failed
      response.cookies.set({
        name: cookieName,
        value: JSON.stringify({
          isValid: false,
          timestamp: Date.now(),
          error: "Sync failed"
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour - shorter expiration for failed validations
      });
    }
  }

  return response;
})

// This configures which routes the middleware runs on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
