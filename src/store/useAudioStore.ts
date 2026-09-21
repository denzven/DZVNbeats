import { create } from 'zustand';
import { Beat, LicensingTierName } from '../types/beat';

interface AudioStoreState {
  playlist: Beat[];
  currentTrack: Beat | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  inquireModalData: { beat: Beat | null; tier?: LicensingTierName } | null;

  // Actions
  setPlaylist: (tracks: Beat[]) => void;
  playTrack: (track: Beat) => void;
  togglePlay: () => void;
  pauseTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  openInquireModal: (beat: Beat | null, tier?: LicensingTierName) => void;
  closeInquireModal: () => void;
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  playlist: [],
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  inquireModalData: null,

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playTrack: (track) => {
    const { currentTrack, isPlaying } = get();
    if (currentTrack?.id === track.id) {
      set({ isPlaying: !isPlaying });
    } else {
      set({ currentTrack: track, isPlaying: true, currentTime: 0 });
    }
  },

  togglePlay: () => {
    const { currentTrack, isPlaying, playlist } = get();
    if (!currentTrack && playlist.length > 0) {
      set({ currentTrack: playlist[0], isPlaying: true });
    } else if (currentTrack) {
      set({ isPlaying: !isPlaying });
    }
  },

  pauseTrack: () => set({ isPlaying: false }),

  nextTrack: () => {
    const { playlist, currentTrack } = get();
    if (!playlist.length) return;
    if (!currentTrack) {
      set({ currentTrack: playlist[0], isPlaying: true, currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    set({ currentTrack: playlist[nextIndex], isPlaying: true, currentTime: 0 });
  },

  prevTrack: () => {
    const { playlist, currentTrack } = get();
    if (!playlist.length) return;
    if (!currentTrack) {
      set({ currentTrack: playlist[playlist.length - 1], isPlaying: true, currentTime: 0 });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ currentTrack: playlist[prevIndex], isPlaying: true, currentTime: 0 });
  },

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  openInquireModal: (beat, tier = 'Free (Tagged)') => set({ inquireModalData: { beat, tier } }),

  closeInquireModal: () => set({ inquireModalData: null }),
}));
