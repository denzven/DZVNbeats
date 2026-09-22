import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCcw, X } from "lucide-react";

export const UpdatePopup: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // Check for SW updates every 1 minute
      if (r) {
        setInterval(() => {
          r.update().catch(console.error);
        }, 60 * 1000);
      }
    },
    onRegisterError(error: any) {
      console.log("SW registration error", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              New Beats Available!
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              An update has been detected. Refresh to hear the latest catalog.
            </p>
          </div>
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="w-full bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider py-2 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh Now
        </button>
      </div>
    </div>
  );
};
