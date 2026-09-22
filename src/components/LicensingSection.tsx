import React from "react";
import {
  Check,
  ShieldCheck,
  Sparkles,
  FileAudio,
  Disc,
  Crown,
} from "lucide-react";
import { LicensingTier } from "../types/beat";
import { useAudioStore } from "../store/useAudioStore";

export const licensingTiers: LicensingTier[] = [
  {
    id: "tier-free",
    name: "Free (Tagged)",
    price: 0,
    format: "320kbps MP3 (Tagged)",
    streamLimit: "Non-profit use only",
    distributionLimit: "0 Copies",
    radioRights: false,
    stemFiles: false,
    description:
      "Perfect for listening, writing, and non-commercial YouTube/SoundCloud uploads. Must credit (Prod. by DZVN).",
  },
  {
    id: "tier-basic",
    name: "Basic Lease",
    price: 200,
    popular: true,
    format: "High Quality WAV (Untagged)",
    streamLimit: "Up to 50,000 Streams",
    distributionLimit: "1,000 Copies",
    radioRights: false,
    stemFiles: false,
    description:
      "Great for independent artists releasing singles on Spotify/Apple Music.",
  },
  {
    id: "tier-exclusive",
    name: "Exclusive Contract",
    price: 1000,
    format: "WAV + Track Stems (Untagged)",
    streamLimit: "UNLIMITED Streams",
    distributionLimit: "UNLIMITED Copies",
    radioRights: true,
    stemFiles: true,
    description:
      "Full ownership rights. Track removed immediately from catalog upon purchase.",
  },
];

export const LicensingSection: React.FC = () => {
  const { currentTrack, playlist, openInquireModal } = useAudioStore();

  const activeBeat = currentTrack || playlist[0];

  return (
    <section
      id="licensing"
      className="py-24 bg-zinc-950 text-zinc-100 border-b border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
            <span>TRANSPARENT STUDIO CONTRACTS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Licensing Options
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Choose the right license tier for your project. All leases include
            instant untagged delivery.
          </p>
        </div>

        {/* Pricing Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {licensingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 ${
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
                {/* Tier Name & Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
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

                {/* Price Display */}
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

                {/* Feature Specs */}
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
                      <strong>Stream Cap:</strong> {tier.streamLimit}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Physical Distribution:</strong>{" "}
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
                      Tracked Stems / Multi-tracks Included
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
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-zinc-800/60">
                <button
                  onClick={() => {
                    if (
                      activeBeat &&
                      !(
                        activeBeat.beatType === "Exclusive" &&
                        tier.name !== "Exclusive Contract"
                      )
                    ) {
                      openInquireModal(activeBeat, tier.name);
                    }
                  }}
                  disabled={
                    activeBeat?.beatType === "Exclusive" &&
                    tier.name !== "Exclusive Contract"
                  }
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                    activeBeat?.beatType === "Exclusive" &&
                    tier.name !== "Exclusive Contract"
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70"
                      : tier.popular
                        ? "bg-white hover:bg-zinc-200 text-zinc-950"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {activeBeat?.beatType === "Exclusive" &&
                  tier.name !== "Exclusive Contract"
                    ? "Unavailable for this Beat"
                    : `Inquire ${tier.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
