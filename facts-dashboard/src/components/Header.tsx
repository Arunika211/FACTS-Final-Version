import Image from 'next/image';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-gradient">
      <div className="flex items-center space-x-2 animate-fadeSlideIn">
        <Image
          src="/globe.svg"
          alt="Logo"
          width={30}
          height={30}
          priority
        />
        <h1 className="text-xl font-bold">Facts Dashboard</h1>
      </div>
      <nav className="flex space-x-4 animate-fadeSlideIn" style={{ animationDelay: '100ms' }}>
        <a href="#" className="hover:underline transition-all duration-200">Home</a>
        <a href="#" className="hover:underline transition-all duration-200">About</a>
        <a href="#" className="hover:underline transition-all duration-200">Contact</a>
      </nav>
    </header>
  );
} 