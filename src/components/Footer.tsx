import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, ArrowUp, Youtube } from "lucide-react";

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      id="about"
      className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 pb-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
                  alt="DZVNbeats Logo"
                  width={32}
                  height={32}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-lg text-white">
                DZVNbeats
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Independent music production studio by producer Denzven (@dzvn_editsss). We produce
              high-fidelity trap, UK drill, and melodic R&amp;B instrumentals for recording
              artists and visual creators.
            </p>
            <p className="text-[11px] font-mono text-zinc-500 mt-4 leading-relaxed">
              © {new Date().getFullYear()} DZVNbeats • Produced &amp; Engineered by Denzven (@dzvn_editsss)
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-200 font-semibold mb-3">
              Catalog &amp; Studio
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/beats"
                  className="hover:text-white transition-colors"
                >
                  Beats Catalog
                </Link>
              </li>
              <li>
                <Link
                  to="/licensing"
                  className="hover:text-white transition-colors"
                >
                  Licensing &amp; Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-200 font-semibold mb-3">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/licensing"
                  className="hover:text-white transition-colors"
                >
                  Licensing Agreement
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="hover:text-white transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials & Connect */}
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-200 font-semibold mb-3">
              Connect
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@DZVNbeats"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="DZVNbeats on YouTube"
              >
                <Youtube className="w-4 h-4" />
                <span className="sr-only">DZVNbeats on YouTube</span>
              </a>
              <a
                href="https://instagram.com/dzvn_editsss"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="DZVNbeats on Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="sr-only">DZVNbeats on Instagram</span>
              </a>
              <a
                href="mailto:dzvn.beats@gmail.com"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="Email DZVNbeats Studio"
              >
                <Mail className="w-4 h-4" />
                <span className="sr-only">Email DZVNbeats Studio</span>
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 font-mono">
              Inquiries: dzvn.beats@gmail.com
              <br />
              Instagram: <a href="https://instagram.com/dzvn_editsss" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">@dzvn_editsss</a>
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex items-center justify-between text-xs font-mono text-zinc-600">
          <span>© {new Date().getFullYear()} DZVNbeats. All rights reserved.</span>
          <button
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <span>TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
