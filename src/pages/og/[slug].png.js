import getPosts from '../../lib/getPosts';
import { quoteImage, canRenderQuote, pngResponse } from '../../lib/ogImage';

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.filter(post => canRenderQuote(post.fields)).map(post => ({
    params: { slug: post.slug.toString() },
    props: { quote: post.fields.quote, author: post.fields.author },
  }));
}

export async function GET({ props }) {
  return pngResponse(await quoteImage(props));
}
