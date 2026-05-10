import { create } from 'zustand';

interface EditSlot {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface HeaderSlotStore {
  editSlot: EditSlot | null;
  setEditSlot: (slot: EditSlot | null) => void;
}

export const useHeaderSlotStore = create<HeaderSlotStore>((set) => ({
  editSlot: null,
  setEditSlot: (editSlot) => set({ editSlot }),
}));