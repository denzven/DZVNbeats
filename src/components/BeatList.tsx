import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Search, Music, SlidersHorizontal, MessageSquare, Download } from 'lucide-react';
import { Beat } from '../types/beat';
import { useAudioStore } from '../store/useAudioStore';

interface BeatListProps {
  beats: Beat[];
}

export const BeatList: React.FC<BeatListProps> = ({ beats }) => {
  const { currentTrack, isPlaying, playTrack, openInquireModal } = useAudioStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'bpm-asc' | 'bpm-desc'>('default');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tagSet.add('All');
    beats.forEach(beat => {
      beat.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [beats]);

  // Filter and sort beats
  const filteredBeats = useMemo(() => {
    return beats
      .filter(beat => {
        const matchesSearch =
          beat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          beat.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (beat.key && beat.key.toLowerCase().includes(searchTerm.toLowerCase())) ||
          beat.bpm.toString().includes(searchTerm);

        const matchesTag =
          selectedTag === 'All' || (beat.tags && beat.tags.includes(selectedTag));

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'bpm-asc') return a.bpm - b.bpm;
        if (sortBy === 'bpm-desc') return b.bpm - a.bpm;
        return 0;
      });
  }, [beats, searchTerm, selectedTag, sortBy]);

  // Framer Motion Stagger Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <section id="beats" className="py-20 bg-zinc-950 text-zinc-100 min-h-[600px] border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
              <Music className="w-4 h-4 text-zinc-500" />
              <span>Catalog &amp; Stems Collection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Studio Instrumentals
            </h2>
          </div>

          {/* Controls & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, BPM, key..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* BPM Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 px-3 py-2 pr-8 rounded-xl focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="default">Sort: Standard</option>
                <option value="bpm-asc">BPM: Low → High</option>
                <option value="bpm-desc">BPM: High → Low</option>
              </select>
              <SlidersHorizontal className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Genre Tags Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-white text-zinc-950 font-semibold shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Beats Staggered List */}
        {filteredBeats.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-zinc-300">No matching beats found</h3>
            <p className="text-sm text-zinc-500 mt-1">Try clearing your search terms or genre filter.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredBeats.map((beat) => {

              const isCurrent = currentTrack?.id === beat.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <motion.div
                  key={beat.id}
                  variants={itemVariants}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-zinc-900/90 border-zinc-600 shadow-xl ring-1 ring-zinc-500/20'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  {/* Left Track Meta Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Track Number / Play Button */}
                    <button
                      onClick={() => playTrack(beat)}
                      aria-label={`Play ${beat.title}`}
                      className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isCurrentPlaying
                          ? 'bg-white text-zinc-950 shadow-lg scale-105'
                          : 'bg-zinc-800/80 group-hover:bg-zinc-700 text-white border border-zinc-700/50'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <div className="flex items-end gap-0.5 h-5 px-1">
                          <span className="w-1 bg-zinc-950 rounded-full animate-wave-bar" style={{ animationDelay: '0s' }}></span>
                          <span className="w-1 bg-zinc-950 rounded-full animate-wave-bar" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1 bg-zinc-950 rounded-full animate-wave-bar" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      ) : (
                        <Play className={`w-5 h-5 ml-0.5 ${isCurrent ? 'fill-white' : ''}`} />
                      )}
                    </button>

                    {/* Track Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white truncate group-hover:text-zinc-200">
                          {beat.title}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md">
                            Now Playing
                          </span>
                        )}
                      </div>

                      {/* Badges & Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                        <span className="font-mono bg-zinc-950/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          {beat.bpm} BPM
                        </span>
                        {beat.key && (
                          <span className="font-mono bg-zinc-950/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            {beat.key}
                          </span>
                        )}
                        <div className="hidden md:flex items-center gap-1.5 ml-1">
                          {beat.tags?.map((tag) => (
                            <span key={tag} className="text-[11px] text-zinc-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Pricing */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-zinc-900">
                    <div className="text-left sm:text-right hidden sm:block">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Status</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        FREE (TAGGED)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={beat.url}
                        download={beat.filename}
                        className="p-2.5 sm:p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all active:scale-95 flex items-center justify-center"
                        title="Download Tagged Free Version"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openInquireModal(beat, 'Basic Lease')}
                        className="px-4 py-2.5 sm:py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-zinc-950" />
                        Buy Untagged
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};
