import getPosts from '../../lib/getPosts';
import Head from 'next/head'

export default function PostPage({slug, quote, url}) {
  return (
    <div className='prose mx-auto text-5xl leading-relaxed max-w-lg'>
          <Head>
            <title>My Quotebook - {quote.fields.author}</title>
            <link rel='icon' href='/favicon.ico' />
          </Head>
          <figure className="quote">
          <blockquote>{quote.fields.quote}</blockquote>
          <figcaption className="text-3xl text-right mt-8">
            &mdash; {quote.fields.author} <cite></cite>
          </figcaption>
        </figure>
      </div>
  );
}

export async function getStaticPaths() {
    const posts = await getPosts();
    const postsPaths = []
    posts.forEach(function(post){
        postsPaths.push(post.slug) 
    })
    const paths = postsPaths.map(post => ({ 
        params: { 
            slug: post.toString() 
        } 
    }));
  return {
    paths: paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug }}) {
    const posts = await getPosts();
    const post = posts.find(p => p.slug == slug)
    const url = process.env.HOST + '/quote/' + slug
    return {
        props: {   
            quote: post,
            url: url 
        }
    }
}

