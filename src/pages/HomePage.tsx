import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, ShieldCheck, ArrowRight, Music, Sliders, Cpu, Disc, Youtube } from 'lucide-react';
import { useAudioStore } from '../store/useAudioStore';
import { Beat } from '../types/beat';

interface HomePageProps {
  beats: Beat[];
}

const resolveUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.replace(/^\.\//, '').replace(/^\//, '');
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`;
};

export const HomePage: React.FC<HomePageProps> = ({ beats }) => {
  const { playTrack, openInquireModal } = useAudioStore();

  const featuredBeats = beats.slice(0, 3);

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Hero Header Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden border-b border-zinc-900 bg-zinc-950">
        
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            src={resolveUrl('/banner.mp4')}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity pointer-events-none scale-105"
          />
        </div>

        {/* Studio Technical Overlays (Grid & Radial Glow) */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.06)_0,transparent_70%)] mix-blend-screen" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

        {/* Vignette & Transition Gradients */}
        <div className="absolute inset-0 z-10 bg-zinc-950/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            HIGH-QUALITY TYPE BEATS FOR <br />
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent italic font-serif">
              CREATIVE ARTISTS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto"
          >
            Free tagged and affordable type beats for young artists and creators. Get high-quality rap instrumentals instantly with untagged WAV downloads, track stems, and direct royalty-free licensing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/beats"
              className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 group active:scale-95"
            >
              <Music className="w-4 h-4 text-zinc-950" />
              Explore Beats Catalog
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/licensing"
              className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              View License Terms
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Beats Spotlight Section */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">Featured Beats</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Top Selections</h2>
            </div>

            <Link
              to="/beats"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>VIEW ALL {beats.length} BEATS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory scrollbar-none">
            {featuredBeats.map((beat) => (
              <div
                key={beat.id}
                className="group relative flex-none w-[80vw] sm:w-[320px] flex flex-col justify-between bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 transition-all duration-300 snap-center"
              >
                <div>
                  {/* Cover Art Frame */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 mb-4 group-hover:shadow-2xl">
                    {beat.coverArt ? (
                      <img
                        src={resolveUrl(beat.coverArt)}
                        alt={beat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Disc className="w-12 h-12 text-zinc-700" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => playTrack(beat)}
                        className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
                      >
                        <Play className="w-6 h-6 fill-zinc-950 ml-0.5" />
                      </button>
                    </div>

                    <span className="absolute top-3 right-3 bg-zinc-950/85 backdrop-blur-md text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-zinc-800">
                      {beat.price === 0 ? 'FREE' : `$${beat.price || 29}`}
                    </span>
                  </div>

                  {/* Track Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-zinc-200 truncate">{beat.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1 flex-wrap">
                      {beat.bpm && (
                        <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          {beat.bpm} BPM
                        </span>
                      )}
                      {beat.key && (
                        <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          {beat.key}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <button
                    onClick={() => playTrack(beat)}
                    className="py-1.5 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Play
                  </button>

                  <button
                    onClick={() => openInquireModal(beat)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Embed Section */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">Visuals &amp; Sessions</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-600" />
                DZVNbeats on YouTube
              </h2>
            </div>

            <a
              href="https://www.youtube.com/@DZVNbeats"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex text-xs font-mono text-zinc-400 hover:text-white items-center gap-1.5 transition-colors"
            >
              <span>SUBSCRIBE TO CHANNEL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Video Embed */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl relative">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/videoseries?list=UUkfS_Y1tV8YIphaoUIoBgrA"
                title="DZVNbeats Latest YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-4">Watch The Process</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Subscribe to the official DZVNbeats YouTube channel for the latest beat uploads, studio sessions, and exclusive behind-the-scenes content. Stay updated with all the new drops.
              </p>
              <a
                href="https://www.youtube.com/@DZVNbeats"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg w-max active:scale-95"
              >
                <Youtube className="w-4 h-4 fill-current" />
                Visit YouTube Channel
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Value Proposition */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <Cpu className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">High-End Analog &amp; Digital Hybrid</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crafted using premium synthesizer hardware, analog warmth, and industry-standard mixing chains for maximum impact in club sound systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <Sliders className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Separated Track Stems</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Premium and Exclusive leases include fully organized, dry 24-bit WAV track stems for custom arrangement and vocal mixing control.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <ShieldCheck className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Instant Direct Licensing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No middleman markup. Direct producer inquiries deliver untagged files, contracts, and stem download keys within hours.
              </p>
            </div>
          </div>


        </div>
      </section>
    </div>
  );
};
