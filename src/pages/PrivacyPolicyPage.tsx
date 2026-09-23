import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Database,
  Eye,
  UserCheck,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LegalNav } from "../components/LegalNav";

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy | DZVNbeats";
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TRANSPARENT DATA ETHICS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            DZVNbeats prioritizes creator privacy and digital autonomy. Learn how
            we handle your data with zero third-party ad tracking, transparent
            local caching, and robust security.
          </p>
        </div>

        {/* Summary Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                No Ad Tracking
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                We never sell your data or use cross-site behavioral tracking ads.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-800 text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                Client-Side Storage
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Player state and volume stay right in your device browser.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                Direct Inquiries
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Communications are strictly used to fulfill beat agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Main Legal Content Sections */}
        <div className="space-y-10 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">01.</span>
              <span>Identification &amp; Controller of Data</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              This Privacy Policy governs the online beat portfolio and music licensing platform
              accessible at{" "}
              <a
                href="https://denzven.github.io/DZVNbeats/"
                className="text-white underline hover:text-emerald-400"
              >
                https://denzven.github.io/DZVNbeats/
              </a>{" "}
              (the &quot;Site&quot; or &quot;Platform&quot;).
            </p>
            <p className="text-zinc-400">
              The Platform is operated by independent record producer and composer{" "}
              <strong className="text-white">Denzven Vadakkan</strong>, professionally known as{" "}
              <strong className="text-white">DZVN / DZVNbeats</strong>, based in Mumbai,
              Maharashtra, India (referred to herein as &quot;we&quot;, &quot;us&quot;, or &quot;Producer&quot;).
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">02.</span>
              <span>Information We Collect &amp; How It Is Obtained</span>
            </h2>
            <div className="space-y-4 text-zinc-400">
              <div>
                <strong className="text-zinc-200 block mb-1">
                  A. Inquiries &amp; License Documentation Data:
                </strong>
                When you initiate a beat inquiry, license application, or generate a custom contract,
                you voluntarily provide information including your artist/legal name, email address,
                phone/WhatsApp number, selected beat title, licensing tier, and payment reference ID.
                This information is exclusively utilized to generate your legal Deal Memorandum and
                deliver uncompressed audio deliverables.
              </div>

              <div>
                <strong className="text-zinc-200 block mb-1">
                  B. Browser LocalStorage &amp; Session Data:
                </strong>
                We store non-sensitive state preferences locally inside your browser, such as audio player
                volume, mute preference, recently played tracks, and client-side contract generator inputs.
                This data never leaves your browser and is not linked to marketing databases.
              </div>

              <div>
                <strong className="text-zinc-200 block mb-1">
                  C. Progressive Web App (PWA) &amp; Infrastructure Logs:
                </strong>
                The platform utilizes Service Workers to provide fast loading and offline functionality
                for core assets (fonts, icons, stylesheets). Large audio files under{" "}
                <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300 font-mono text-xs">
                  /public/beats/
                </code>{" "}
                are explicitly excluded from persistent service worker cache to protect your device storage.
                Standard server logs (IP address, browser type, referral headers) are processed by GitHub
                Pages for uptime and network security.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">03.</span>
              <span>Cookies &amp; Tracking Technologies Policy</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              DZVNbeats does <strong>not</strong> deploy advertising cookies, third-party analytics cookies,
              or cross-site profiling trackers. We do not participate in programmatic ad exchanges.
            </p>
            <p className="text-zinc-400">
              If you interact with third-party social integrations (such as clicking external links to YouTube,
              Instagram, or email links), those external platforms operate under their respective privacy
              policies. We encourage you to review their terms.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">04.</span>
              <span>Legal Basis &amp; Compliance (IT Act 2000 &amp; Global Standards)</span>
            </h2>
            <p className="text-zinc-400 mb-3">
              Our data processing complies with the <em>Information Technology Act, 2000</em> and the{" "}
              <em>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</em> of India.
            </p>
            <p className="text-zinc-400">
              We process personal data on the lawful basis of contractual necessity (fulfilling your license,
              providing contract certificates, and transferring master audio files) and legitimate business interests
              (maintaining intellectual property records and preventing fraudulent claims).
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-sm">05.</span>
              <span>Data Retention &amp; User Rights</span>
            </h2>
            <div className="space-y-3 text-zinc-400">
              <p>
                As a music creator or licensee, you possess statutory rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                <li>
                  <strong>Right to Access &amp; Confirmation:</strong> Request a summary of correspondence or license agreements issued in your name.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Update or correct artist credentials or contact information on future contract exhibits.
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of contact records, subject to statutory requirements to retain copyright transfer and proof-of-licensing records under the Indian Copyright Act, 1957.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 - Grievance Officer & Contact */}
          <section className="bg-zinc-900/60 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Grievance Officer &amp; Privacy Contact</span>
            </h2>
            <p className="text-zinc-400 mb-4">
              For privacy inquiries, data deletion requests, or questions regarding our data practices,
              please reach out directly to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">DATA CONTROLLER &amp; GRIEVANCE</span>
                <span className="text-white font-bold block">Denzven Vadakkan (DZVNbeats)</span>
                <span className="text-zinc-400 text-[11px] block mt-1">
                  Mumbai, Maharashtra, India
                </span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-center">
                <span className="text-zinc-500 block mb-1">DIRECT INQUIRY EMAIL</span>
                <a
                  href="mailto:dzvn.beats@gmail.com"
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>dzvn.beats@gmail.com</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
