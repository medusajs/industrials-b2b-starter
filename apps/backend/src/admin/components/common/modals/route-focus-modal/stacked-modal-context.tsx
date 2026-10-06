import { createContext } from "react";

type StackedModalContextValue = {
  register: (id: string) => void;
  unregister: (id: string) => void;
  getIsOpen: (id: string) => boolean;
  setIsOpen: (id: string, isOpen: boolean) => void;
};

export const StackedModalContext =
  createContext<StackedModalContextValue | null>(null);
