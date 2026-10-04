import React from 'react';
import { Sprout, Heart, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

/**
 * Global Footer Component
 */
const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 pt-16 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-emerald-500 mr-2" />
              <span className="font-bold text-xl text-stone-100">CropShield</span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Empowering farmers with AI-driven visual diagnostics, weather-smart protection plans, and localized voice advisory.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-stone-100 font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/detect" className="hover:text-emerald-400 transition-colors">Plant Diagnosis</a></li>
              <li><a href="/soil" className="hover:text-emerald-400 transition-colors">Satellite Soil Lab</a></li>
              <li><a href="/smart-farm" className="hover:text-emerald-400 transition-colors">Yield Master</a></li>
              <li><a href="/expert" className="hover:text-emerald-400 transition-colors">Live Expert Connect</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-stone-100 font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</a></li>
              <li><a href="/profile" className="hover:text-emerald-400 transition-colors">Farmer Dashboard</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition-colors">Agronomy FAQs</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Open Data Initiative</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-stone-100 font-semibold mb-4">Community</h4>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-stone-500 hover:text-emerald-400 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-stone-500 hover:text-emerald-400 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-stone-500 hover:text-emerald-400 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-stone-500 hover:text-emerald-400 transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="flex items-center gap-1">
            Built with <Heart className="h-4 w-4 text-red-500 fill-current" /> for farmers worldwide
          </p>
          <p className="mt-2 md:mt-0">© {new Date().getFullYear()} CropShield AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
