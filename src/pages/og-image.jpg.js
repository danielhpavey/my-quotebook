import { siteImage, jpegResponse } from '../lib/ogImage';

export async function GET() {
  return jpegResponse(await siteImage());
}
