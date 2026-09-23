import { create } from "zustand";
import { Beat, LicensingTierName } from "../types/beat";

/**
 * The AudioStoreState interface defines the global state for the audio player.
 * It manages the currently loaded playlist, the track currently playing, playback status (play/pause),
 * volume, and handles the logic for skipping tracks and interacting with the Inquire Modal.
 * State is managed globally across the application using Zustand.
 */
interface AudioStoreState {
  /** The full array of beats currently loaded into the player (usually from BeatsPage or Home) */
  playlist: Beat[];
  /** The currently active/playing beat object, or null if nothing is loaded */
  currentTrack: Beat | null;
  /** Boolean indicating whether the audio is currently playing */
  isPlaying: boolean;
  /** Volume level from 0.0 to 1.0 */
  volume: number;
  /** Boolean indicating whether the audio is muted */
  isMuted: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration of the current track in seconds */
  duration: number;
  /** State holding the beat and tier selected for the Inquire Modal (purchase dialog) */
  inquireModalData: { beat: Beat | null; tier?: LicensingTierName } | null;
  /** State holding the beat currently open in the Share Modal */
  shareModalBeat: Beat | null;

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
  openShareModal: (beat: Beat) => void;
  closeShareModal: () => void;
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
  shareModalBeat: null,

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
      set({
        currentTrack: playlist[playlist.length - 1],
        isPlaying: true,
        currentTime: 0,
      });
      return;
    }
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ currentTrack: playlist[prevIndex], isPlaying: true, currentTime: 0 });
  },

  setVolume: (volume) =>
    set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  openInquireModal: (beat, tier) => {
    let resolvedTier: LicensingTierName = "Free (Tagged)";
    if (tier) {
      resolvedTier = tier;
    } else if (beat?.beatType === "Exclusive") {
      resolvedTier = "Exclusive Contract";
    } else if (beat?.beatType === "Standard" && beat.price > 0) {
      resolvedTier = "Basic Lease";
    }
    set({ inquireModalData: { beat, tier: resolvedTier } });
  },

  closeInquireModal: () => set({ inquireModalData: null }),

  openShareModal: (beat) => set({ shareModalBeat: beat }),

  closeShareModal: () => set({ shareModalBeat: null }),
}));
