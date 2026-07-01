import { create } from 'zustand';

const useLocations = create((set) => ({
  locations: [],
  setLocations: (l) => set(() => ({ locations: l })),
}));

export default useLocations;
