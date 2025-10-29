import { create } from 'zustand';
import type { Episode } from '@/types';

// Estructura del estado global
type EpisodiosState = {
  episodios: Episode[];
  setEpisodios: (rows: Episode[]) => void;  // reemplaza todos
  upsertEpisode: (e: Episode) => void;      // actualiza o reemplaza uno
  lastImport?: {                            // resumen de la carga
    total: number;
    valid: number;
    errors: number;
    missingHeaders?: string[];
  } | null;
  setLastImport: (s: EpisodiosState['lastImport']) => void;
};

// Creación del store
export const useEpisodes = create<EpisodiosState>((set) => ({
  episodios: [],

  setEpisodios: (rows) => set({ episodios: rows }),

  upsertEpisode: (e) =>
    set((s) => ({
      episodios: s.episodios.map((x) =>
        x.episodio === e.episodio ? e : x
      ),
    })),

  lastImport: null,

  setLastImport: (s) => set({ lastImport: s }),
}));
