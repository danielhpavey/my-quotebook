import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className='flex flex-col min-h-screen font-sans text-gray-700 p-4'>
      <menu className="pb-sm">
	  	<div className="w-full text-right text-lg">
	  		<span className="inline-block "><Link href='/'><a className="block hover:bg-blue-500 transition hover:text-white p-3 duration-500">Home</a></Link></span>
	  		<span className="inline-block "><Link href='/about'><a className="block hover:bg-blue-500 transition hover:text-white p-3 duration-500">About</a></Link></span>
	  	</div>
      </menu>
      <main className='container mx-auto flex-1 p-4 max-w-screen-xl'>{children}</main>
      <footer className='mt-8 py-4 bg-tree bg-no-repeat h-72 flip'>
        <div className='container mx-auto flex justify-center'>
        </div>
      </footer>
    </div>
  );
}

