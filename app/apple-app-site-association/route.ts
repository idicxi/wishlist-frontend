export { GET } from '../.well-known/apple-app-site-association/route';

// Конфиг должен объявляться в этом файле, а не реэкспортироваться,
// иначе Next.js ругается при билде.
export const dynamic = 'force-static';

