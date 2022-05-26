import Head from 'next/head';
import getPosts from '../lib/getPosts';
import Link from 'next/link';

export default function Home({posts}) {
  return (
    <div>
      <Head>
        <title>My Quotebook</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <header className='h-42'>
        <div className='w-full'>
          <span className='block text-6xl md:text-8xl font-display mb-8'>My Quotebook</span>
        </div>
      </header>
      <main className="text-xl">
          {posts.map(post => (
                <Link href={`/quote/${post.slug}`} key={post.slug}><a className="block hover:bg-blue-500 transition hover:text-white p-4 duration-500 rounded">
              <figure className="quote mb-8">
              <blockquote>{post.fields.quote}</blockquote>
              <figcaption>
                &mdash; {post.fields.author} <cite></cite>
              </figcaption>
            </figure>
                </a></Link>
          ))}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const posts = await getPosts();

  return {
    props: {
      posts,
    },
  };
}
