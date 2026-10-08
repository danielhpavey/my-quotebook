import { siteImage, pngResponse } from '../lib/ogImage';

export async function GET() {
  return pngResponse(await siteImage());
}
