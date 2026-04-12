import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rotas completamente públicas — não verifica sessão
  const isPublica = 
    pathname === '/login' || 
    pathname.startsWith('/auth/');

  if (isPublica) {
    return NextResponse.next();
  }

  // Para rotas protegidas, verifica cookie de sessão do Supabase
  const hasCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
  );

  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};