import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Instagram,
  Mail,
  ExternalLink,
  MessageSquare,
  Music,
  Download,
  FileText,
} from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";
import { LicensingTierName } from "../types/beat";

const tiersList: LicensingTierName[] = [
  "Free (Tagged)",
  "Basic Lease",
  "Exclusive Contract",
];

export const InquireModal: React.FC = () => {
  const { inquireModalData, closeInquireModal } = useAudioStore();
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState<LicensingTierName | null>(
    null,
  );

  if (!inquireModalData) return null;

  const { beat, tier: initialTier } = inquireModalData;

  const isExclusiveOnly = beat?.beatType === "Exclusive";
  const availableTiers = isExclusiveOnly
    ? ["Exclusive Contract" as LicensingTierName]
    : tiersList;

  const currentTier = availableTiers.includes(selectedTier as LicensingTierName)
    ? selectedTier
    : availableTiers.includes(initialTier as LicensingTierName)
      ? initialTier
      : availableTiers[0];

  const formattedMessage = beat
    ? `Hey DZVN, I am interested in licensing the ${currentTier} for the beat: "${beat.title}". Let's finalize the license agreement.`
    : `Hey DZVN, I am interested in acquiring a ${currentTier}. Let's discuss details and license terms.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstagramClick = () => {
    // Automatically copy message for desktop user convenience
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);

    // Attempt mobile ig.me scheme or standard profile redirect
    const igUrl = `https://ig.me/m/dzvn_editsss`;
    window.open(igUrl, "_blank", "noopener,noreferrer");
  };

  const handleEmailClick = () => {
    const subject = beat
      ? encodeURIComponent(`Beat License Inquiry: ${beat.title} (${currentTier})`)
      : encodeURIComponent(`${currentTier} Inquiry`);
    const body = encodeURIComponent(formattedMessage);
    window.location.href = `mailto:dzvn.beats@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={closeInquireModal}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              {currentTier === "Free (Tagged)" ? (
                <Download className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {currentTier === "Free (Tagged)"
                  ? "Download Free Version"
                  : "Buy Untagged License"}
              </h3>
              <p className="text-xs text-zinc-400">
                {currentTier === "Free (Tagged)"
                  ? "Get the tagged beat instantly for non-profit use."
                  : "DM on Instagram to purchase and receive files."}
              </p>
            </div>
          </div>

          {/* Target Track Preview Pill */}
          {beat && (
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Music className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-sm text-white block truncate">
                    {beat.title}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {beat.bpm} BPM • {beat.key || "Studio Track"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-lg">
                FREE (TAGGED)
              </span>
            </div>
          )}

          {/* Tier Selector Pills */}
          <div className="mb-5">
            <label className="text-xs font-mono uppercase text-zinc-400 block mb-2">
              Select License Tier
            </label>
            <div
              className={`grid gap-1.5 sm:gap-2 ${availableTiers.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}
            >
              {availableTiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t as LicensingTierName)}
                  className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center text-center leading-tight whitespace-nowrap ${
                    currentTier === t
                      ? "bg-white text-zinc-950 font-semibold shadow"
                      : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {t.replace(" (Tagged)", "").replace(" Contract", "")}
                </button>
              ))}
            </div>
          </div>

          {currentTier === "Free (Tagged)" ? (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                <p className="text-xs text-zinc-300">
                  <strong className="text-white">Format:</strong> High-Quality Studio WAV (with voice tags).
                </p>
                <p className="text-xs text-zinc-300">
                  <strong className="text-white">Usage:</strong> Strictly non-commercial &amp; non-monetized use only. Zero revenue permitted.
                </p>
                <p className="text-xs text-emerald-400 font-medium">
                  Mandatory Credit: (Prod. by DZVN) in title &amp; description.
                </p>
                <p className="text-[11px] text-zinc-500 pt-1">
                  For Spotify, Apple Music, or monetization, select the ₹200 Basic Lease.
                </p>
              </div>
              {beat ? (
                <div className="space-y-2">
                  <a
                    href={beat.url}
                    download={beat.filename}
                    className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4 text-zinc-950" />
                    Download Free Tagged WAV
                  </a>
                  <a
                    href="/contracts/DZVNbeats_Free_Tagged_License.pdf"
                    download
                    className="w-full py-2 px-3 text-center text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    Download Free License Agreement (PDF)
                  </a>
                </div>
              ) : (
                <div className="w-full py-3 px-4 bg-zinc-900 text-zinc-500 font-bold text-xs uppercase tracking-wider rounded-xl text-center border border-zinc-800">
                  Select a beat from the catalog to download
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Selected Tier Summary Badge */}
              <div className="mb-4 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">
                    {currentTier === "Basic Lease"
                      ? "Basic Lease (₹200)"
                      : "Exclusive Contract (₹1,000)"}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {currentTier === "Basic Lease"
                      ? "Untagged WAV • Up to 50,000 Streams • 1 Monetized Video"
                      : "Untagged WAV + Stems • Beat Retired • Recoup 100% of first ₹2,000"}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200">
                  {currentTier === "Basic Lease" ? "₹200" : "₹1,000"}
                </span>
              </div>

              {/* Pre-filled Message Display */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Formatted Studio Inquiry
                  </label>
                  {copied && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3 h-3" /> Copied to Clipboard
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={formattedMessage}
                    className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono resize-none focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    title="Copy text"
                    className="absolute top-2.5 right-2.5 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Primary Lead Generation Actions */}
              <div className="space-y-2.5">
                <button
                  onClick={handleInstagramClick}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <Instagram className="w-4 h-4 text-zinc-950" />
                  Open Instagram DM &amp; Copy Message
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </button>

                <button
                  onClick={handleEmailClick}
                  className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Mail className="w-4 h-4 text-zinc-400" />
                  Send Email Inquiry
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 px-4 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied to Clipboard!" : "Copy Text Only"}
                </button>

                <div className="pt-2 text-center">
                  <a
                    href={
                      currentTier === "Basic Lease"
                        ? "/contracts/DZVNbeats_Basic_Lease_Agreement.pdf"
                        : "/contracts/DZVNbeats_Exclusive_Contract.pdf"
                    }
                    download
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700 underline-offset-4"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    Download Standard {currentTier} Agreement (PDF)
                  </a>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
