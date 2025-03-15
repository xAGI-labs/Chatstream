import { create } from "zustand"

interface SignupDialogStore {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useSignupDialog = create<SignupDialogStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}))

