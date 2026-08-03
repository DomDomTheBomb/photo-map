import { create } from 'zustand';

const useLocations = create((set) => ({
  locations: [],
  photos: [],
  setLocations: (l) => set(() => ({ locations: l })),
  addLocation: (loc) =>
    set((state) => ({ locations: [loc, ...state.locations] })),
  setPhotos: (p) => set(() => ({ photos: p })),
}));

export default useLocations;
