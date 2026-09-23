import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LegalNav } from "../components/LegalNav";

export const RefundPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = "Refund & Cancellation Policy | DZVNbeats";
    window.scrollTo(0, 0);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pt-28 pb-32 bg-zinc-950 text-zinc-100 min-h-screen selection:bg-zinc-800"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/licensing"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Legal &amp; Licensing</span>
          </Link>
          <span className="text-xs font-mono text-zinc-500">
            Last Updated: September 2026
          </span>
        </div>

        {/* Tab Navigation */}
        <LegalNav />

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-cyan-400 mb-4">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>TRANSPARENT DIGITAL COMMERCE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Refund &amp; Cancellation
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Our clear policy on digital audio instrumentals, WAV files, track stems,
            and custom licensing agreements.
          </p>
        </div>

        {/* Comparison Grid: Eligible vs Ineligible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase font-mono mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span>Eligible for Refund / Replacement</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Duplicate Transaction:</strong> Accidental double payment for the same beat and tier.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Defective Audio Asset:</strong> Corrupt or distorted WAV/stem files that cannot be resolved within 48 hours.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Non-Fulfillment:</strong> Failure to deliver purchased audio files or contract certificate within agreed timeframe.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-rose-500/20">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase font-mono mb-4">
              <XCircle className="w-4 h-4" />
              <span>Non-Refundable Circumstances</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Change of Mind:</strong> Creative redirection or buyer&apos;s remorse after files have been downloaded.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Commercial Performance:</strong> Low stream counts, lack of playlist placement, or unfulfilled commercial expectations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Unread Terms:</strong> Purchasing a Basic Lease and wanting unpermitted rights (e.g. Content ID or unlimited streams).
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">01.</span>
              <span>Digital Goods Policy Overview</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              DZVNbeats supplies intangible digital audio goods including uncompressed 24-bit WAV files,
              multi-track stem archives, and verified legal Deal Memorandums.
            </p>
            <p className="text-zinc-400">
              In accordance with standard global e-commerce and consumer protection regulations governing
              digitally delivered media, all sales are considered final and irrevocable once the download
              credentials or audio files have been transmitted to the client, subject only to the verified exceptions
              outlined above.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">02.</span>
              <span>Cancellation of Custom Services</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              If you have commissioned custom production, exclusive revisions, or reserved an exclusive beat,
              you may cancel your inquiry prior to final contract issuance and master file dispatch.
            </p>
            <p className="text-zinc-400">
              Once an Exclusive Contract Deal Memorandum has been executed and master stems have been transferred,
              the agreement is legally binding and non-cancellable under the Indian Contract Act, 1872.
            </p>
          </section>

          {/* Section 3 - Refund Request Steps */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>How to Submit a Refund or Dispute Request</span>
            </h2>
            <p className="text-zinc-400 mb-4">
              If you experience an accidental duplicate charge or technical file issue, please submit a request
              within <strong>7 days</strong> of the transaction:
            </p>

            <div className="space-y-3 text-zinc-300">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-xs font-mono text-cyan-400 block mb-1">STEP 1 • EMAIL DIRECTLY</span>
                Send an email to <strong className="text-white">dzvn.beats@gmail.com</strong> with the subject line:
                <div className="mt-1 font-mono text-xs text-white bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">
                  Refund Request - [Beat Title] - [UPI / Transaction Reference]
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-xs font-mono text-cyan-400 block mb-1">STEP 2 • ATTACH VERIFICATION</span>
                Attach proof of transaction, your artist name, and a concise explanation of the defect or duplicate charge.
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="text-xs font-mono text-cyan-400 block mb-1">STEP 3 • RESOLUTION &amp; REVERSAL</span>
                We investigate within 24 to 48 hours. If approved, refunds are credited back to your original payment
                source (UPI or bank account) within 5 to 7 business days.
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
