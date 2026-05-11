import { create } from 'zustand';

interface EditSlot {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface PageHeader {
  title: string;
  hideHamburger: boolean;
}

interface HeaderSlotStore {
  editSlot: EditSlot | null;
  setEditSlot: (slot: EditSlot | null) => void;
  pageHeader: PageHeader | null;
  setPageHeader: (header: PageHeader | null) => void;
}

export const useHeaderSlotStore = create<HeaderSlotStore>((set) => ({
  editSlot: null,
  setEditSlot: (editSlot) => set({ editSlot }),
  pageHeader: null,
  setPageHeader: (pageHeader) => set({ pageHeader }),
}));