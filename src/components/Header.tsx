import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Download,
  Instagram,
  Mail,
  Volume2,
  ShieldCheck,
  Home,
  Menu,
  X,
  Youtube,
} from "lucide-react";

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner group-hover:border-zinc-500 transition-colors">
            <img
              src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
              alt="DZVNbeats Favicon"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              DZVN<span className="text-zinc-500 font-light">beats</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                Beat Collection
              </span>
            </div>
          </div>
        </Link>

        {/* Multi-Page Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "text-white font-bold border-b border-white pb-0.5"
                  : "text-zinc-400 hover:text-white"
              }`
            }
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </NavLink>

          <NavLink
            to="/beats"
            className={({ isActive }) =>
              `flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "text-white font-bold border-b border-white pb-0.5"
                  : "text-zinc-400 hover:text-white"
              }`
            }
          >
            <Volume2 className="w-3.5 h-3.5" />
            Beats Catalog
          </NavLink>

          <NavLink
            to="/licensing"
            className={({ isActive }) =>
              `flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "text-white font-bold border-b border-white pb-0.5"
                  : "text-zinc-400 hover:text-white"
              }`
            }
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Licensing &amp; Legal
          </NavLink>
        </nav>

        {/* Actions & PWA Install */}
        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <button
              onClick={handleInstallPWA}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              Install App
            </button>
          )}

          <a
            href="https://www.youtube.com/@DZVNbeats"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all"
          >
            <Youtube className="w-4 h-4" />
          </a>

          <a
            href="https://instagram.com/dzvn_editsss"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all"
          >
            <Instagram className="w-4 h-4" />
          </a>

          <a
            href="mailto:dzvn.beats@gmail.com"
            aria-label="Email DZVN"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all"
          >
            <Mail className="w-4 h-4" />
          </a>

          <Link
            to="/beats"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white text-zinc-950 rounded-xl hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            Store
          </Link>
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-4 flex flex-col gap-4 shadow-xl">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-mono tracking-wider uppercase transition-colors ${
                isActive ? "text-white font-bold" : "text-zinc-400"
              }`
            }
          >
            <Home className="w-4 h-4" />
            Home
          </NavLink>
          <NavLink
            to="/beats"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-mono tracking-wider uppercase transition-colors ${
                isActive ? "text-white font-bold" : "text-zinc-400"
              }`
            }
          >
            <Volume2 className="w-4 h-4" />
            Beats Catalog
          </NavLink>
          <NavLink
            to="/licensing"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-mono tracking-wider uppercase transition-colors ${
                isActive ? "text-white font-bold" : "text-zinc-400"
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            Licensing &amp; Legal
          </NavLink>
        </nav>
      )}
    </header>
  );
};
