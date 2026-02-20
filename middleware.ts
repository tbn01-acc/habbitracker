export const config = {
  // Исключаем все файлы с расширениями (assets, images, и т.д.) и служебные пути
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  
  // Если запрос идет к папке assets — вообще ничего не делаем
  if (url.pathname.startsWith('/assets/')) {
    return new Response(null, {
      headers: { 'x-middleware-next': '1' }
    });
  }

  // Ваша логика проксирования базы данных...
  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}
