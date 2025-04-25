import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleUploadClick = () => {
    navigate('/upload-resume');
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-300 flex items-center"
            >
              <span className="mr-2">🤖</span>
              AI Mock Interview
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`${
                isActivePath('/') 
                  ? 'text-indigo-600 font-semibold'
                  : 'text-gray-600 hover:text-indigo-600'
              } relative group transition-all duration-300`}
            >
              Home
              <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                isActivePath('/') ? 'scale-x-100' : ''
              }`}></span>
            </Link>
            <Link
              to="/sessions"
              className={`${
                isActivePath('/sessions')
                  ? 'text-indigo-600 font-semibold'
                  : 'text-gray-600 hover:text-indigo-600'
              } relative group transition-all duration-300`}
            >
              History
              <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                isActivePath('/sessions') ? 'scale-x-100' : ''
              }`}></span>
            </Link>
            <button
              onClick={handleUploadClick}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Upload Resume
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white/90 backdrop-blur-md border-t border-gray-200 transition-all duration-300`}>
        <div className="pt-2 pb-3 space-y-1 px-4">
          <Link
            to="/"
            className={`${
              isActivePath('/')
                ? 'text-indigo-600 font-semibold'
                : 'text-gray-600 hover:text-indigo-600'
            } block px-3 py-2 text-base font-medium transition-all duration-300`}
          >
            Home
          </Link>
          <Link
            to="/sessions"
            className={`${
              isActivePath('/sessions')
                ? 'text-indigo-600 font-semibold'
                : 'text-gray-600 hover:text-indigo-600'
            } block px-3 py-2 text-base font-medium transition-all duration-300`}
          >
            History
          </Link>
          <button
            onClick={handleUploadClick}
            className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 transition-all duration-300"
          >
            Upload Resume
          </button>
        </div>
      </div>
    </nav>
  );
}