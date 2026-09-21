import React from 'react';
import { Check, Sparkles, FileAudio, Disc, Crown, HelpCircle, FileText, Scale } from 'lucide-react';
import { licensingTiers } from '../components/LicensingSection';
import { useAudioStore } from '../store/useAudioStore';

export const LicensingLegalPage: React.FC = () => {
  const { openInquireModal } = useAudioStore();

  return (
    <div className="pt-28 pb-32 bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Licensing &amp; Legal Terms
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-4 leading-relaxed">
            Review detailed usage rights, deliverable audio formats, and legal agreement terms before acquiring your beat lease or exclusive rights.
          </p>
        </div>

        {/* Licensing Tiers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
          {licensingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 ${
                tier.popular
                  ? 'bg-zinc-900/90 border-zinc-600 shadow-2xl ring-1 ring-zinc-400/20 md:-translate-y-2'
                  : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
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
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  {tier.name === 'Free (Tagged)' && <FileAudio className="w-5 h-5 text-zinc-500" />}
                  {tier.name === 'Basic Lease' && <Disc className="w-5 h-5 text-zinc-300" />}
                  {tier.name === 'Exclusive Contract' && <Crown className="w-5 h-5 text-amber-400" />}
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold font-mono text-white">
                    {tier.price === 0 ? 'FREE' : `₹${tier.price}`}
                  </span>
                  {tier.price !== 0 && (
                    <span className="text-xs text-zinc-500 font-mono">
                      {tier.name === 'Exclusive Contract' ? ' starting' : ' / lease'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  {tier.description}
                </p>

                <div className="space-y-3 text-xs text-zinc-300 border-t border-zinc-800/80 pt-6">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Audio Format:</strong> {tier.format}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Audio Streams:</strong> {tier.streamLimit}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Physical Copies:</strong> {tier.distributionLimit}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 ${tier.stemFiles ? 'text-emerald-400' : 'text-zinc-600'} flex-shrink-0 mt-0.5`} />
                    <span className={tier.stemFiles ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      Separated Track Stems Included
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 ${tier.radioRights ? 'text-emerald-400' : 'text-zinc-600'} flex-shrink-0 mt-0.5`} />
                    <span className={tier.radioRights ? 'text-zinc-200' : 'text-zinc-500 line-through'}>
                      Radio Airplay &amp; Commercial Broadcasting
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/60">
                <button
                  onClick={() => {
                    openInquireModal(null, tier.name as any);
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                    tier.popular
                      ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800'
                  }`}
                >
                  Inquire {tier.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Legal Rights Overview & Contract Breakdown */}
        <div className="mb-20 bg-zinc-900/40 border border-zinc-900 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-zinc-300" />
            <h2 className="text-2xl font-bold text-white">Standard License Terms &amp; Conditions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-zinc-400 leading-relaxed">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                1. Non-Exclusive Lease Rights
              </h3>
              <p>
                Purchasing a Basic Lease grants the licensee a non-exclusive right to record vocals, mix, and distribute the new song. The producer (DZVNbeats) retains copyright ownership of the underlying composition.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                2. Exclusive Ownership Rights
              </h3>
              <p>
                Upon purchasing Exclusive Rights, full master ownership and sole commercial exploitation rights transfer to the buyer. The beat will be immediately removed from the catalog and will not be sold to any other party.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                3. Credit &amp; Royalty Rights
              </h3>
              <p>
                The Licensee must credit "Produced by DZVN" in all digital release metadata, liner notes, and video titles. Performance rights royalties are split 50/50 between Writer and Producer for non-exclusive leases unless negotiated otherwise.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                4. Instant Untagged Delivery
              </h3>
              <p>
                All delivered files (MP3, WAV, or Stems) are completely untagged without audio voice tags. Download links and signed PDF contracts are issued immediately upon inquiry confirmation.
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
            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl">
              <h3 className="text-sm font-bold text-zinc-200 mb-1">What happens if I exceed my stream limit?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If your song reaches the stream cap of your current lease (e.g. 50k for Basic Lease), you simply upgrade to Exclusive Rights by paying the difference.
              </p>
            </div>

            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl">
              <h3 className="text-sm font-bold text-zinc-200 mb-1">Can I register my song with Content ID / YouTube ContentID?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Non-exclusive leases cannot be registered with automated ContentID systems (to prevent false copyright strikes against other lease holders). ContentID registration is only permitted with Exclusive Rights.
              </p>
            </div>

            <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-xl">
              <h3 className="text-sm font-bold text-zinc-200 mb-1">How fast do I receive beat files after inquiring?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Inquiries are monitored 24/7. Once confirmed via Instagram DM or Email, custom direct download links and PDF contract agreements are sent within 2 to 4 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
