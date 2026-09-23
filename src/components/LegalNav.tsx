import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, ShieldCheck, FileText, RotateCcw } from "lucide-react";

export const LegalNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    {
      to: "/licensing",
      label: "Licensing & Agreements",
      icon: Scale,
    },
    {
      to: "/privacy",
      label: "Privacy Policy",
      icon: ShieldCheck,
    },
    {
      to: "/terms",
      label: "Terms of Service",
      icon: FileText,
    },
    {
      to: "/refund",
      label: "Refund & Cancellation",
      icon: RotateCcw,
    },
  ];

  return (
    <div className="w-full flex items-center justify-center mb-10 overflow-x-auto py-2">
      <nav
        aria-label="Legal & Policies Navigation"
        className="inline-flex p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md gap-1"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-emerald-400" : "text-zinc-500"
                }`}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
