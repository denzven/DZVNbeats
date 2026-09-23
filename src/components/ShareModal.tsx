import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  Send,
} from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";
import { resolveUrl, getBeatShareUrl } from "../utils/url";

export const ShareModal: React.FC = () => {
  const { shareModalBeat, closeShareModal } = useAudioStore();
  const [copied, setCopied] = useState(false);

  if (!shareModalBeat) return null;

  const beat = shareModalBeat;
  const shareUrl = getBeatShareUrl(beat.id);
  const coverUrl = beat.coverArt ? resolveUrl(beat.coverArt) : resolveUrl("banner.png");

  const shareText = `🎵 Listen to "${beat.title}" (${beat.bpm ? beat.bpm + " BPM" : "Studio Track"}${
    beat.key ? " • " + beat.key : ""
  }) on DZVNbeats:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${beat.title} - Type Beat | DZVNbeats`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Native share error:", err);
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `Check out "${beat.title}" (${beat.bpm ? beat.bpm + " BPM" : "Beat"}${
        beat.key ? " • " + beat.key : ""
      }) by @DZVNbeats:`,
    );
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        {/* Modal Backdrop Click */}
        <div className="absolute inset-0" onClick={closeShareModal} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
        >
          {/* Close Button */}
          <button
            onClick={closeShareModal}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Beat</h3>
              <p className="text-xs text-zinc-400">
                Direct link carries ID3 cover art & auto-plays on open
              </p>
            </div>
          </div>

          {/* Social Card Preview */}
          <div className="mb-5 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Live Social Card Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Discord / Twitter / WhatsApp
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                <img
                  src={coverUrl}
                  alt={beat.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = resolveUrl("banner.png");
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-white truncate">{beat.title}</h4>
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mt-0.5">
                  <span>{beat.bpm ? `${beat.bpm} BPM` : "140 BPM"}</span>
                  {beat.key && (
                    <>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    {beat.status === "Sold"
                      ? "SOLD OUT"
                      : beat.beatType === "Exclusive"
                        ? "EXCLUSIVE"
                        : beat.price === 0
                          ? "FREE DOWNLOAD"
                          : `₹${beat.price}`}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">DZVNbeats</span>
                </div>
              </div>
            </div>
          </div>

          {/* URL Box & 1-Click Copy */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase text-zinc-400">Direct Share Link</label>
              {copied && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Copied to Clipboard
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopy}
                className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-1.5 flex-shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-white hover:bg-zinc-200 text-zinc-950 active:scale-95"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                Share via Apps (iOS / Android)
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-medium text-xs rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp
                <ExternalLink className="w-3 h-3 text-zinc-400 ml-auto" />
              </button>

              <button
                onClick={handleTwitterShare}
                className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-medium text-xs rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <span className="font-bold text-xs text-sky-400">𝕏</span>
                X / Twitter
                <ExternalLink className="w-3 h-3 text-zinc-400 ml-auto" />
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[11px] text-zinc-400 text-center mt-4">
            Recipients will see the track artwork on chat apps and can listen directly.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
