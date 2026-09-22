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
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
                  alt="DZVNbeats Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-lg text-white">
                DZVNbeats
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Premium, hard-hitting type beats for upcoming artists. Download
              free tagged instrumentals instantly or grab affordable leases for
              your next hit.
            </p>
            <p className="text-[11px] font-mono text-zinc-500 mt-4">
              © {new Date().getFullYear()} DZVNbeats. All rights reserved.
              Serverless PWA.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-200 font-semibold mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Page
                </Link>
              </li>
              <li>
                <Link
                  to="/beats"
                  className="hover:text-white transition-colors"
                >
                  Beats Catalog (Grid)
                </Link>
              </li>
              <li>
                <Link
                  to="/licensing"
                  className="hover:text-white transition-colors"
                >
                  Licensing &amp; Legal Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials & Connect */}
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-200 font-semibold mb-3">
              Direct Connect
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@DZVNbeats"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/dzvn_editsss"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:dzvn.beats@gmail.com"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 font-mono">
              Inquiries: dzvn.beats@gmail.com
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex items-center justify-between text-xs font-mono text-zinc-600">
          <span>HOSTED ON GITHUB PAGES • PWA READY</span>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <span>TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SEO / Meta keywords */}
        <div className="pt-8 mt-4 text-justify text-[9px] text-zinc-800 leading-relaxed font-sans">
          Premium type beats and instrumentals for sale. Download free type
          beats, buy rap beats for sale, and lease high-quality trap type beats,
          R&amp;B instrumentals, and drill type beats instantly. Drake type
          beat, Travis Scott type beat, Future type beat, Metro Boomin type
          beat, Playboi Carti type beat, Lil Uzi Vert type beat, 21 Savage type
          beat, J. Cole type beat, Kendrick Lamar type beat, Gunna type beat,
          Lil Baby type beat, Young Thug type beat, Don Toliver type beat, The
          Weeknd type beat, Bryson Tiller type beat, Partynextdoor type beat,
          Brent Faiyaz type beat, Pop Smoke type beat, Central Cee type beat,
          Chief Keef type beat, Yeat type beat, Ken Carson type beat, Destroy
          Lonely type beat, Lil Tecca type beat, Juice WRLD type beat,
          XXXTentacion type beat, Polo G type beat, Roddy Ricch type beat, NBA
          Youngboy type beat.
        </div>
      </div>
    </footer>
  );
};
