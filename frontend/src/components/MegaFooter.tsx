'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube } from 'react-icons/fa';
import { PUBLIC_NAV_ITEMS } from '@/config/routes';

export default function MegaFooter() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Broker</h3>
            <p className="text-gray-400 mb-6">
              Find your next home, faster.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaLinkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Explore — only real, existing routes */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Explore</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-gray-400 hover:text-white transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-white transition">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-10"></div>

        {/* Bottom Footer */}
        {/*
          NOTE: Privacy/Terms/Cookie policy links intentionally removed —
          those pages don't exist yet (src/app has no /privacy, /terms,
          or /cookies route). Add them back here once those pages are
          actually built; a footer link to a 404 is worse than no link.
        */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Broker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
