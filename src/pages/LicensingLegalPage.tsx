import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  FileAudio,
  Disc,
  Crown,
  ChevronDown,
  Download,
  FileCheck,
  X,
  FileText,
  ShieldCheck,
  Music,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { licensingTiers } from "../components/LicensingSection";
import { LegalNav } from "../components/LegalNav";
import { useAudioStore } from "../store/useAudioStore";
import { resolveUrl } from "../utils/url";

export const LicensingLegalPage: React.FC = () => {
  const { openInquireModal } = useAudioStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Custom Contract Generator Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customArtistName, setCustomArtistName] = useState("");
  const [customBeatTitle, setCustomBeatTitle] = useState("");
  const [customTier, setCustomTier] = useState<
    "Free (Tagged)" | "Basic Lease" | "Exclusive Contract"
  >("Basic Lease");
  const [customTxId, setCustomTxId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Can I release songs on Spotify, Apple Music, and YouTube?",
      a: "Yes! With the Basic Lease (₹200), you can distribute to all major streaming platforms up to 50,000 streams and monetize 1 music video while keeping 100% of your royalties. Exclusive licenses offer unlimited distribution.",
    },
    {
      q: "What is the Free (Tagged) version for?",
      a: "The free version includes audio producer tags and is meant for auditioning, demo writing, and non-monetized streaming on SoundCloud or YouTube. For monetized releases on streaming platforms, grab a Basic Lease.",
    },
    {
      q: "What happens if my song exceeds 50,000 streams?",
      a: "If your track takes off and approaches 50,000 streams, simply reach out to upgrade your license. You only pay the difference—no penalties or retroactive fees.",
    },
    {
      q: "What are track stems and why do I need them?",
      a: "Stems are individual, unmixed tracks for each element of the beat (drums, 808, melody, synths). They give your mixing and mastering engineer total control to sculpt the sound around your vocals.",
    },
    {
      q: "Why can't leased beats be put in YouTube Content ID?",
      a: "Because non-exclusive leases are used by multiple artists, registering with Content ID or automated fingerprinting would trigger false copyright claims against fellow creators. Only exclusive owners can register Content ID.",
    },
    {
      q: "How do I receive my beat files and agreement?",
      a: "After payment confirmation via UPI or bank transfer, your high-definition untagged WAV files, stem archives, and official signed PDF license agreement are delivered straight to your email within hours.",
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pt-28 pb-32 bg-zinc-950 text-zinc-100 min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <LegalNav />

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TRANSPARENT LICENSING</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Beat Licensing &amp; Pricing
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-4 leading-relaxed">
            Keep 100% of your earnings. Straightforward terms, instant delivery,
            and official agreements ready for digital distributors.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Generate Signed Agreement (PDF)</span>
            </button>
          </div>
        </div>

        {/* Licensing Tiers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
          {licensingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between p-7 rounded-2xl border transition-all ${
                tier.popular
                  ? "bg-zinc-900/90 border-zinc-700 shadow-2xl ring-1 ring-zinc-500/20 md:-translate-y-1.5"
                  : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-white text-zinc-950 font-mono text-[10px] font-extrabold uppercase tracking-wider shadow flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-zinc-950" />
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  {tier.name === "Free (Tagged)" && (
                    <FileAudio className="w-5 h-5 text-zinc-500" />
                  )}
                  {tier.name === "Basic Lease" && (
                    <Disc className="w-5 h-5 text-zinc-300" />
                  )}
                  {tier.name === "Exclusive Contract" && (
                    <Crown className="w-5 h-5 text-amber-400" />
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {tier.price === 0 ? "FREE" : `₹${tier.price}`}
                  </span>
                  {tier.price !== 0 && (
                    <span className="text-xs text-zinc-500 font-mono">
                      {tier.name === "Exclusive Contract"
                        ? " flat fee"
                        : " / release"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  {tier.description}
                </p>

                {/* Features List */}
                <div className="space-y-2.5 text-xs text-zinc-300 border-t border-zinc-800/80 pt-5">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{tier.format}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{tier.streamLimit}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{tier.distributionLimit}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        tier.stemFiles ? "text-emerald-400" : "text-zinc-600"
                      }`}
                    />
                    <span
                      className={
                        tier.stemFiles
                          ? "text-zinc-200"
                          : "text-zinc-500 line-through"
                      }
                    >
                      Track Stems (Multi-tracks)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Keep 100% Streaming Royalties</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span>Credit: (Prod. DZVN)</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-8 pt-5 border-t border-zinc-800/60 space-y-2">
                <button
                  onClick={() => {
                    openInquireModal(null, tier.name as any);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                    tier.popular
                      ? "bg-white hover:bg-zinc-200 text-zinc-950"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {tier.price === 0
                    ? "Download Free Tagged"
                    : `Inquire ${tier.name}`}
                </button>

                <a
                  href={
                    tier.id === "tier-free"
                      ? resolveUrl("contracts/DZVNbeats_Free_Tagged_License.pdf")
                      : tier.id === "tier-basic"
                      ? resolveUrl("contracts/DZVNbeats_Basic_Lease_Agreement.pdf")
                      : resolveUrl("contracts/DZVNbeats_Exclusive_Contract.pdf")
                  }
                  download
                  className="w-full py-1.5 text-center text-[11px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Contract PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Rights Comparison Table */}
        <div className="mb-20 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-zinc-400" />
            Rights Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-3">Feature</th>
                  <th className="py-3 px-3">Free (Tagged)</th>
                  <th className="py-3 px-3 text-white font-bold">Basic Lease (₹200)</th>
                  <th className="py-3 px-3 text-amber-400 font-bold">Exclusive (₹1,000)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Audio Format</td>
                  <td className="py-3 px-3 text-zinc-400">Tagged MP3/WAV</td>
                  <td className="py-3 px-3 font-semibold text-white">Untagged 24-bit WAV</td>
                  <td className="py-3 px-3 text-amber-300 font-semibold">Untagged WAV + Stems</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Commercial Streams</td>
                  <td className="py-3 px-3 text-zinc-500">Non-commercial only</td>
                  <td className="py-3 px-3">Up to 50,000 Streams</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">Unlimited Streams</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Music Videos</td>
                  <td className="py-3 px-3 text-zinc-500">Unmonetized only</td>
                  <td className="py-3 px-3">1 Monetized Video</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">Unlimited Videos</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Track Stems</td>
                  <td className="py-3 px-3 text-zinc-500">No</td>
                  <td className="py-3 px-3 text-zinc-500">No</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">Yes (Full Archive)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">YouTube Content ID</td>
                  <td className="py-3 px-3 text-zinc-500">Not Allowed</td>
                  <td className="py-3 px-3 text-zinc-500">Not Allowed</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">Allowed</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Beat Exclusivity</td>
                  <td className="py-3 px-3 text-zinc-500">Non-Exclusive</td>
                  <td className="py-3 px-3 text-zinc-500">Non-Exclusive</td>
                  <td className="py-3 px-3 text-amber-300 font-semibold">Retired from Catalog</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Plain-English Licensing Rules */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white">How Our Licenses Work</h2>
            <p className="text-xs text-zinc-400 mt-2">
              Everything in plain English, with zero fine-print gotchas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">
                Keep 100% Royalties
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You collect every rupee from Spotify, Apple Music, and YouTube views within your stream cap.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <Music className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">
                Producer Credit
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Add <em>(Prod. DZVN)</em> or credit Denzven Vadakkan in your track title or streaming metadata.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <ShieldCheck className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">
                Strike Protection
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Content ID is disabled on leases so you and fellow artists never receive automated copyright strikes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <Headphones className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">
                Instant Delivery
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Get your 24-bit WAV file and official signed PDF agreement sent directly to your email upon inquiry.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-zinc-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Contract Generator Modal */}
        <AnimatePresence>
          {isCustomModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
              >
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  aria-label="Close modal"
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Generate Signed Agreement
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Official PDF ready for digital distributors.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1 text-[11px]">
                      Artist / Stage Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Your Artist Name"
                      value={customArtistName}
                      onChange={(e) => setCustomArtistName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1 text-[11px]">
                      Beat Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ransom, Flute Case"
                      value={customBeatTitle}
                      onChange={(e) => setCustomBeatTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1 text-[11px]">
                      License Tier
                    </label>
                    <select
                      value={customTier}
                      onChange={(e) => setCustomTier(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="Basic Lease">Basic Lease (₹200)</option>
                      <option value="Exclusive Contract">Exclusive Contract (₹1,000)</option>
                      <option value="Free (Tagged)">Free (Tagged) (₹0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1 text-[11px]">
                      UPI / Transaction Ref ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/2026/001"
                      value={customTxId}
                      onChange={(e) => setCustomTxId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>

                  <button
                    disabled={isGenerating}
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const { generateCustomContractPdf } = await import(
                          "../utils/generateCustomContractPdf"
                        );
                        await generateCustomContractPdf({
                          artistName: customArtistName || "Verified Artist",
                          beatTitle: customBeatTitle || "Studio Beat",
                          tierName: customTier,
                          transactionId: customTxId || "VERIFIED-ELECTRONIC-LICENSE",
                        });
                        setIsCustomModalOpen(false);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    className="w-full mt-3 py-2.5 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-zinc-950" />
                    {isGenerating ? "Generating PDF..." : "Download Official PDF"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
