import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  FileAudio,
  Disc,
  Crown,
  HelpCircle,
  FileText,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  Coins,
  Lock,
  ChevronDown,
  Download,
  FileCheck,
  X,
} from "lucide-react";
import { licensingTiers } from "../components/LicensingSection";
import { useAudioStore } from "../store/useAudioStore";
import { generateCustomContractPdf } from "../utils/generateCustomContractPdf";
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
      q: "Who is the legal copyright holder of the beats?",
      a: "All musical compositions, sound recordings, beat arrangements, and production masters are original intellectual property owned by Denzven Vadakkan, operating professionally under the artist moniker DZVN / DZVNbeats (Mumbai, Maharashtra, India). Leases grant limited exploitation rights; exclusive contracts transfer master rights while retaining statutory composer/publishing credits under the Indian Copyright Act, 1957.",
    },
    {
      q: "How does the 'Culture-First' Recoupment Guarantee work for Exclusive (₹1,000)?",
      a: "We believe in supporting artists while growing together. When you buy an Exclusive Contract for ₹1,000, you keep 100% of the first ₹2,000 earned from the song (2x your beat investment) to completely recoup your production, recording, and marketing costs. Only after your gross song revenue crosses ₹2,000 does the 20% Net Master Royalty split kick in for DZVNbeats.",
    },
    {
      q: "Can I release a song on Spotify, Apple Music, or Wynk using the Free (Tagged) version?",
      a: "No. The Free (Tagged) version is strictly for non-commercial, non-monetized evaluation, rehearsal, and unmonetized social media demos. For digital streaming platforms (DSPs) where monetization occurs, you must purchase at least the Basic Lease (₹200) to obtain commercial streaming rights and untagged high-quality audio.",
    },
    {
      q: "What if an artist uses stolen lyrics, uncleared samples, or gets sued for their song?",
      a: "Under the Indemnification Clause (Sections 124 & 125, Indian Contract Act, 1872), the artist guarantees 100% originality of their lyrics, vocals, and artwork. If the artist is sued for copyright infringement, plagiarism, sample theft, or defamation, the artist is legally required to defend, indemnify, and hold completely harmless Denzven Vadakkan (DZVNbeats). Zero liability transfers to the producer.",
    },
    {
      q: "Why is producer liability capped strictly to the license price (₹200 or ₹1,000)?",
      a: "Under Section 73 & 74 of the Indian Contract Act, 1872, our liability is strictly capped to the actual sum you paid. We disclaim all speculative and indirect damages—meaning an artist cannot claim that a beat 'ruined their career', caused a lost record deal, or failed to go viral. The beat is provided on an 'AS-IS' professional studio standard basis.",
    },
    {
      q: "Can I register my song with YouTube Content ID or acoustic fingerprinting?",
      a: "Free (Tagged) and Basic Lease holders are strictly prohibited from submitting the track to YouTube Content ID, Shazam, or Meta Rights Manager. This protects every other artist who licenses the beat from receiving automated false copyright strikes. Content ID fingerprinting is strictly reserved for Exclusive Contract holders.",
    },
    {
      q: "Which jurisdiction and laws govern these license agreements?",
      a: "All agreements are governed by the laws of the Republic of India, specifically the Indian Copyright Act, 1957, the Indian Contract Act, 1872, and the Information Technology Act, 2000. Any legal dispute is subject to the exclusive jurisdiction of the competent civil courts in Mumbai, Maharashtra, India.",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
            <Scale className="w-3.5 h-3.5 text-zinc-300" />
            <span>LEGAL AGREEMENTS &amp; LICENSING</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Licensing &amp; Legal Terms
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-4 leading-relaxed">
            Transparent, legally binding agreements designed for the culture.
            Explore our 3 tiers—from free non-profit downloads to our culture-first
            recoupment model—backed by Indian copyright and contract law.
          </p>
        </div>

        {/* Legal Identity / Jurisdiction Banner */}
        <div className="mb-14 p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 flex-shrink-0">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <p className="text-zinc-200 font-semibold text-sm">
                Licensor &amp; Copyright Owner:{" "}
                <span className="text-white font-bold">Denzven Vadakkan</span>{" "}
                <span className="text-zinc-400 font-normal">
                  (p/k/a DZVN / DZVNbeats)
                </span>
              </p>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Governing Law: Republic of India • Exclusive Jurisdiction:{" "}
                <span className="text-zinc-300 font-medium">
                  Mumbai, Maharashtra, India
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>IT Act 2000 &amp; Copyright Act 1957 Compliant</span>
          </div>
        </div>

        {/* Licensing Tiers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
          {licensingTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.15 + index * 0.15,
                ease: "easeOut",
              }}
              className="flex flex-col"
            >
              <div
                className={`relative h-full flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 ${
                  tier.popular
                    ? "bg-zinc-900/90 border-zinc-600 shadow-2xl ring-1 ring-zinc-400/20 md:-translate-y-2"
                    : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-zinc-950 font-mono text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-zinc-950" />
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {tier.name}
                    </h3>
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

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      {tier.price === 0 ? "FREE" : `₹${tier.price}`}
                    </span>
                    {tier.price !== 0 && (
                      <span className="text-xs text-zinc-500 font-mono">
                        {tier.name === "Exclusive Contract"
                          ? " starting"
                          : " / lease"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {tier.description}
                  </p>

                  <div className="space-y-3 text-xs text-zinc-300 border-t border-zinc-800/80 pt-6">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Audio Deliverable:</strong> {tier.format}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Commercial Stream Cap:</strong>{" "}
                        {tier.streamLimit}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Physical / Digital Sales:</strong>{" "}
                        {tier.distributionLimit}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 ${tier.stemFiles ? "text-emerald-400" : "text-zinc-600"} flex-shrink-0 mt-0.5`}
                      />
                      <span
                        className={
                          tier.stemFiles
                            ? "text-zinc-200"
                            : "text-zinc-500 line-through"
                        }
                      >
                        Separated Track Stems (Multi-tracks)
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 ${tier.radioRights ? "text-emerald-400" : "text-zinc-600"} flex-shrink-0 mt-0.5`}
                      />
                      <span
                        className={
                          tier.radioRights
                            ? "text-zinc-200"
                            : "text-zinc-500 line-through"
                        }
                      >
                        Radio Airplay &amp; Commercial Broadcasting
                      </span>
                    </div>

                    {tier.recoupmentThreshold && (
                      <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-emerald-200 font-semibold">
                            Culture-First Recoupment:
                          </strong>
                          <span className="text-[11px] text-emerald-300/90 leading-tight block">
                            Keep 100% of first ₹2,000 earned. 20% net royalty only applies if song earns &gt; ₹2,000.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 text-[11px] text-zinc-400">
                      <Check className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Credit Attribution:</strong>{" "}
                        {tier.creditRequirement}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800/60 space-y-2">
                  <button
                    onClick={() => {
                      openInquireModal(null, tier.name as any);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
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
                    className="w-full py-2 px-3 rounded-xl text-center text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800/80 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Agreement (PDF)
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PDF Contract Download & Custom Certificate Hub */}
        <div className="mb-20 bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-xs font-mono text-zinc-300 mb-3">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFICIAL STUDIO CONTRACT CENTER</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Download Official Contract Agreements (PDF)
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                Download verified, distributor-ready legal agreements in PDF format featuring the official DZVNbeats studio seal. Required by DistroKid, TuneCore, and major DSPs to clear sample and beat rights.
              </p>
            </div>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-5 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap self-start lg:self-center"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              Generate Custom Artist Agreement
            </button>
          </div>

          {/* Quick PDF Download Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <a
              href={resolveUrl("contracts/DZVNbeats_Free_Tagged_License.pdf")}
              download
              className="p-5 bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl group transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                  Free (Tagged)
                </span>
                <span className="text-xs font-mono text-zinc-500">₹0</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-zinc-200 mb-1">
                Non-Commercial License
              </h4>
              <p className="text-[11px] text-zinc-500 mb-4">
                High-quality tagged WAV rights, 0 commercial revenue, credit terms.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-300 group-hover:text-white mt-auto">
                <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                <span>Download PDF Agreement</span>
              </div>
            </a>

            <a
              href={resolveUrl("contracts/DZVNbeats_Basic_Lease_Agreement.pdf")}
              download
              className="p-5 bg-zinc-950/70 border border-zinc-700/80 hover:border-zinc-500 rounded-2xl group transition-all flex flex-col justify-between relative shadow-lg ring-1 ring-emerald-500/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Basic Lease (Untagged)
                </span>
                <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                  ₹200
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-zinc-200 mb-1">
                Indie Commercial Lease
              </h4>
              <p className="text-[11px] text-zinc-500 mb-4">
                50k streams, 1 monetized YouTube video, untagged WAV deliverable.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-300 group-hover:text-white mt-auto">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Download PDF Agreement</span>
              </div>
            </a>

            <a
              href={resolveUrl("contracts/DZVNbeats_Exclusive_Contract.pdf")}
              download
              className="p-5 bg-zinc-950/70 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl group transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  Exclusive Rights
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                  ₹1,000
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-zinc-200 mb-1">
                Full Ownership Contract
              </h4>
              <p className="text-[11px] text-zinc-500 mb-4">
                Unlimited streams, track stems, catalog retirement &amp; ₹2,000 recoupment buffer.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-300 group-hover:text-white mt-auto">
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-200">Download PDF Contract</span>
              </div>
            </a>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-20 bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 sm:p-10 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-zinc-300" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Licensing Rights Comparison Table
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4">Feature / Right</th>
                  <th className="py-3 px-4 text-zinc-300">Free (Tagged)</th>
                  <th className="py-3 px-4 text-white font-bold">Basic Lease (₹200)</th>
                  <th className="py-3 px-4 text-amber-400 font-bold">Exclusive Contract (₹1,000)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Price</td>
                  <td className="py-3 px-4 font-mono">₹0 (Free)</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">₹200</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-300">₹1,000 (starting)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Audio Format</td>
                  <td className="py-3 px-4">Master WAV (Voice Tagged)</td>
                  <td className="py-3 px-4">Untagged High-Quality WAV</td>
                  <td className="py-3 px-4">Untagged Master WAV + Stems</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Commercial Streams</td>
                  <td className="py-3 px-4 text-zinc-500">0 (Non-profit only)</td>
                  <td className="py-3 px-4">Up to 50,000 Streams</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">UNLIMITED</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">YouTube Monetization</td>
                  <td className="py-3 px-4 text-zinc-500">No (Unmonetized only)</td>
                  <td className="py-3 px-4">1 Monetized Video</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">UNLIMITED Videos</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Physical &amp; Digital Sales</td>
                  <td className="py-3 px-4 text-zinc-500">0 Copies</td>
                  <td className="py-3 px-4">Up to 500 Copies</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">UNLIMITED Copies</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Separated Multi-Track Stems</td>
                  <td className="py-3 px-4 text-zinc-500">No</td>
                  <td className="py-3 px-4 text-zinc-500">No</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">Included (All Stems)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Artist Recoupment Buffer</td>
                  <td className="py-3 px-4 text-zinc-500">N/A</td>
                  <td className="py-3 px-4 text-zinc-500">N/A</td>
                  <td className="py-3 px-4 text-emerald-400 font-medium">Keep 100% of first ₹2,000</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Backend Net Royalty</td>
                  <td className="py-3 px-4 text-zinc-500">N/A</td>
                  <td className="py-3 px-4 text-zinc-500">0% (Keep 100% under 50k streams)</td>
                  <td className="py-3 px-4">20% Net Master share only if &gt; ₹2,000</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Catalog Exclusivity</td>
                  <td className="py-3 px-4 text-zinc-500">Non-exclusive</td>
                  <td className="py-3 px-4 text-zinc-500">Non-exclusive</td>
                  <td className="py-3 px-4 text-amber-300 font-semibold">Beat Permanently Retired</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Content ID Registration</td>
                  <td className="py-3 px-4 text-red-400 font-semibold">Strictly Prohibited</td>
                  <td className="py-3 px-4 text-red-400 font-semibold">Strictly Prohibited</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">Permitted (Exclusive Only)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Mandatory Credit</td>
                  <td className="py-3 px-4">Title &amp; Desc: (Prod. by DZVN)</td>
                  <td className="py-3 px-4">Title &amp; Metadata: (Prod. by DZVN)</td>
                  <td className="py-3 px-4">Title &amp; Metadata: (Prod. by DZVN)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Legal Rights Overview & Contract Breakdown */}
        <div className="mb-20 bg-zinc-900/40 border border-zinc-900 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-zinc-300" />
            <h2 className="text-2xl font-bold text-white">
              Standard Studio License Terms &amp; Contract Clauses
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mb-8 leading-relaxed max-w-3xl">
            The following clauses govern every beat licensed or downloaded from
            DZVNbeats. By downloading, streaming, leasing, or purchasing any beat,
            the Licensee unconditionally agrees to these terms, forming a binding
            contract under Section 10A of the Information Technology Act, 2000
            and the Indian Contract Act, 1872.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-zinc-400 leading-relaxed">
            {/* Clause 1 */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                1. Parties &amp; Contract Formation
              </h3>
              <p>
                This agreement is entered into between <strong>Denzven Vadakkan</strong>,
                professionally operating as <strong>DZVN / DZVNbeats</strong> ("Licensor" /
                "Producer", Mumbai, Maharashtra), and the user downloading or purchasing
                the beat ("Licensee" / "Artist"). Electronic confirmation, DM receipt, or
                file download constitutes valid execution under the IT Act, 2000.
              </p>
            </div>

            {/* Clause 2 */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                2. Scope of License Grant
              </h3>
              <p>
                <strong>Free Tier (₹0):</strong> Grants a non-commercial, revocable evaluation
                license. Audio carries voice tags. Zero monetization permitted.
                <br />
                <strong>Basic Lease (₹200):</strong> Grants a non-exclusive commercial
                license up to 50,000 streams across Spotify, Apple Music, and 1 monetized
                YouTube video. Untagged WAV delivery.
                <br />
                <strong>Exclusive Contract (₹1,000):</strong> Grants sole and exclusive
                commercial exploitation rights. Beat is permanently retired from catalog.
              </p>
            </div>

            {/* Clause 3 */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                3. Mandatory Credit &amp; Moral Rights (Sec 57)
              </h3>
              <p>
                Licensee must prominently credit <strong>"Produced by DZVN"</strong> in all
                song titles, metadata, video descriptions, and streaming liner notes
                (e.g., <em>"Track Title (Prod. by DZVN)"</em>). Producer retains
                statutory moral rights under Section 57 of the Indian Copyright Act, 1957,
                including the right of paternity and protection against derogatory
                distortion.
              </p>
            </div>

            {/* Clause 4 */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                4. The "Culture-First" Recoupment &amp; Royalty Split
              </h3>
              <p>
                <strong>Artist Recoupment Buffer:</strong> For Exclusive Contract holders
                (₹1,000), the Artist retains <strong>100% of the first ₹2,000 earned</strong> from
                the new song to recoup production and promotional costs.
                <br />
                <strong>Backend Net Royalty:</strong> If and only if cumulative song earnings
                exceed ₹2,000, Artist agrees to pay DZVNbeats a <strong>20% Net Master
                Royalty</strong> on all excess digital streaming, sync, and download revenues.
                Composer publishing is split 50/50 statutory under the Copyright Act.
              </p>
            </div>

            {/* Clause 5 */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                5. Content ID &amp; Acoustic Fingerprinting
              </h3>
              <p>
                Free and Basic leaseholders are strictly prohibited from submitting the
                Beat or master recording to automated fingerprinting systems, including
                YouTube Content ID, Meta Rights Manager, Shazam, or SoundExchange.
                Violation triggers automatic termination of rights and immediate DMCA /
                Section 51 copyright take-down notices.
              </p>
            </div>

            {/* Clause 6 - Indemnification */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                6. Artist Indemnification &amp; Copyright Shield (Sec 124-125)
              </h3>
              <p>
                Artist unconditionally warrants that all lyrics, vocal recordings,
                melodic interpolations, artwork, and marketing materials added to the Beat
                are 100% original to the Artist or legally licensed. If the Artist steals
                lyrics, copies third-party melodies, uses uncleared samples, or is sued for
                copyright infringement, Artist shall <strong>indemnify, defend, and hold
                completely harmless Denzven Vadakkan and DZVNbeats</strong> against any and all
                claims, damages, court costs, and legal fees. Zero liability passes to the
                Producer.
              </p>
            </div>

            {/* Clause 7 - Defamation & Criminal Lyrical Disclaimers */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                7. Defamation, Obscenity &amp; Criminal Content Shield
              </h3>
              <p>
                Producer exercises zero editorial oversight or censorship over Artist's
                lyrics. Artist assumes 100% civil and criminal liability for all vocal
                content under the Bharatiya Nyaya Sanhita, 2023 (BNS), Information
                Technology Act, 2000 (Sections 67, 69A), and related Indian statutes.
                Producer disclaims all liability for hate speech, communal disharmony,
                defamation, or unlawful utterances.
              </p>
            </div>

            {/* Clause 8 - Absolute Limitation of Liability */}
            <div className="space-y-3 p-5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-zinc-400" />
                8. Absolute Limitation of Monetary Liability (Sec 73-74)
              </h3>
              <p>
                To the maximum extent permitted under Indian law, the total cumulative
                aggregate liability of Denzven Vadakkan / DZVNbeats for ANY claim, breach,
                or dispute arising out of this agreement <strong>SHALL BE STRICTLY CAPPED
                AND LIMITED TO THE EXACT AMOUNT ACTUALLY PAID BY THE ARTIST FOR THE BEAT
                (₹0 for Free Tier, ₹200 for Basic Lease, or ₹1,000 for Exclusive Contract)</strong>.
                Producer disclaims all liability for speculative or indirect damages,
                including claims that a beat "ruined a career", caused a lost record deal,
                or resulted in algorithm penalties. Beat is provided "AS-IS".
              </p>
            </div>
          </div>

          {/* Clause 9 - Governing Law & Mumbai Jurisdiction */}
          <div className="mt-8 p-6 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-zinc-300" />
                9. Governing Law &amp; Exclusive Mumbai Jurisdiction
              </h4>
              <p className="text-zinc-400">
                This Agreement shall be interpreted and governed in accordance with the
                substantive laws of the Republic of India. In the event of any legal dispute,
                the parties submit to the exclusive jurisdiction of the competent civil
                courts located in <strong>Mumbai, Maharashtra, India</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Legal FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-zinc-400" />
            Frequently Asked Legal Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-zinc-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40">
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
                className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
              >
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Generate Custom License Agreement
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Instantly generate a signed studio agreement with your artist name.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1.5">
                      Artist / Stage Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MC Divine, Krsna, or Real Name"
                      value={customArtistName}
                      onChange={(e) => setCustomArtistName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1.5">
                      Beat Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Akbaar, Flute Case, or Custom"
                      value={customBeatTitle}
                      onChange={(e) => setCustomBeatTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1.5">
                      License Tier
                    </label>
                    <select
                      value={customTier}
                      onChange={(e) => setCustomTier(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="Basic Lease">Basic Lease (₹200)</option>
                      <option value="Exclusive Contract">Exclusive Contract (₹1,000)</option>
                      <option value="Free (Tagged)">Free (Tagged) (₹0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-mono uppercase mb-1.5">
                      Transaction / UPI Ref ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/2026/849201"
                      value={customTxId}
                      onChange={(e) => setCustomTxId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>

                  <button
                    disabled={isGenerating}
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        await generateCustomContractPdf({
                          artistName: customArtistName || "Verified Artist",
                          beatTitle: customBeatTitle || "Studio Beat",
                          tierName: customTier,
                          transactionId: customTxId || "ELECTRONIC-AUTHENTICATION",
                        });
                        setIsCustomModalOpen(false);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    className="w-full mt-4 py-3 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-zinc-950" />
                    {isGenerating ? "Generating PDF..." : "Generate & Download Official PDF"}
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
