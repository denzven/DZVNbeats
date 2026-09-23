import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Scale,
  Gavel,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LegalNav } from "../components/LegalNav";

export const TermsOfServicePage: React.FC = () => {
  useEffect(() => {
    document.title = "Terms of Service | DZVNbeats";
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400 mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>BINDING COVENANTS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Please review these Terms of Service governing your use of DZVNbeats,
            audio previewing, non-exclusive leasing, and exclusive beat licensing.
          </p>
        </div>

        {/* Important Warning Banner: Content ID */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-12 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-zinc-300">
            <strong className="text-amber-300 font-bold block mb-1">
              STRICT PROHIBITION: Content ID &amp; Fingerprinting Registration
            </strong>
            Under no circumstances may a Licensee registering a Free (Tagged) or
            non-exclusive Basic Lease submit the master recording to YouTube
            Content ID, Meta Rights Manager, Shazam, or acoustic fingerprinting databases.
            Violations constitute immediate material breach and cause forfeiture of licensing rights.
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">01.</span>
              <span>Acceptance of Agreement</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              By accessing, browsing, auditioning audio, or acquiring music licenses from{" "}
              <strong>DZVNbeats</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;), operated by{" "}
              <strong>Denzven Vadakkan</strong> (&quot;Producer&quot;, &quot;Licensor&quot;), you (&quot;User&quot;, &quot;Artist&quot;, &quot;Licensee&quot;)
              expressly agree to be bound by these Terms of Service and all incorporated licensing policies.
            </p>
            <p className="text-zinc-400">
              If you do not accept these terms in their entirety, you must discontinue use of the Platform and
              must not download or synchronize any audio recordings.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">02.</span>
              <span>Intellectual Property &amp; Master Ownership</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              All musical beats, instrumental arrangements, sound recordings, audio stems, artwork, and code on
              this Platform are the exclusive intellectual property of Denzven Vadakkan, protected under the{" "}
              <em>Indian Copyright Act, 1957</em> and international intellectual property treaties.
            </p>
            <p className="text-zinc-400">
              Purchasing a lease or downloading a tagged track does <strong>not</strong> convey sale of the
              underlying musical composition. The Producer retains all statutory moral rights and composer publishing
              share in accordance with statutory copyright protections.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">03.</span>
              <span>License Scope &amp; Deliverables</span>
            </h2>
            <div className="space-y-4 text-zinc-400">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-white font-bold block mb-1">
                  A. Free (Tagged) License:
                </span>
                Non-exclusive, non-transferable evaluation license. Permitted strictly for private listening,
                rehearsals, and non-commercial social media clips without advertising monetization. No DSP distribution.
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-white font-bold block mb-1">
                  B. Basic Lease (₹200):
                </span>
                Non-exclusive commercial synchronization license. Permits distribution up to 50,000 digital streams
                across Spotify, Apple Music, and DSPs, 1 monetized music video, and untagged high-definition audio deliverable.
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-white font-bold block mb-1">
                  C. Exclusive Contract (₹1,000):
                </span>
                Full sole-master rights transfer subject to statutory composer credit and the Culture-First Recoupment
                guarantee (artist keeps 100% of first ₹2,000 earned before any royalty split applies).
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">04.</span>
              <span>Mandatory Credit &amp; Attribution</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              Licensee shall give statutory author attribution to the Producer on all commercial releases,
              metadata submissions (DistroKid, TuneCore, etc.), YouTube titles/descriptions, and physical media:
            </p>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400">
              &quot;Song Title (Prod. DZVN)&quot; or &quot;Song Title (Prod. by DZVNbeats)&quot;
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">05.</span>
              <span>Artist Indemnification &amp; Vocal Warranties</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              Under Sections 124 &amp; 125 of the <em>Indian Contract Act, 1872</em>, the Artist warrants that any
              lyrics, vocals, recorded audio, performance, and artwork incorporated with the beat are 100% original
              and do not infringe upon any third party&apos;s copyright, trademark, privacy, or defamation rights.
            </p>
            <p className="text-zinc-400">
              The Artist agrees to defend, indemnify, and hold completely harmless Denzven Vadakkan and DZVNbeats
              from any and all liabilities, damages, claims, or legal fees resulting from the Artist&apos;s derivative work.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-mono text-sm">06.</span>
              <span>Limitation of Liability (Sections 73 &amp; 74, Contract Act 1872)</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              To the maximum extent permitted by law, the Producer provides all beats and digital services on an
              &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis.
            </p>
            <p className="text-zinc-400">
              The aggregate liability of Denzven Vadakkan and DZVNbeats arising out of any license or transaction shall
              in no event exceed the actual monetary amount paid by the Licensee for that specific beat license. We expressly
              disclaim all incidental, speculative, or consequential damages (including lost streaming revenue or anticipated contracts).
            </p>
          </section>

          {/* Section 7 - Jurisdiction */}
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              <span>Governing Law &amp; Exclusive Jurisdiction</span>
            </h2>
            <p className="text-zinc-400 mb-4">
              These Terms and any dispute, controversy, or claim arising out of or related to your use of DZVNbeats
              shall be governed exclusively by the laws of the Republic of India.
            </p>
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300">
              EXCLUSIVE LEGAL JURISDICTION: COMPETENT CIVIL COURTS IN MUMBAI, MAHARASHTRA, INDIA.
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
