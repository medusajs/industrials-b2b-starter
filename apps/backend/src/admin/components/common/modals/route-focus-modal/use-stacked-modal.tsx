import { useCallback, useContext, useEffect } from "react";
import { StackedModalContext } from "./stacked-modal-context";

export const useStackedModal = () => {
  const context = useContext(StackedModalContext);

  if (!context) {
    return {
      register: () => {},
      unregister: () => {},
      getIsOpen: () => false,
      setIsOpen: () => {},
    };
  }

  return context;
};

export const useStackedModalItem = (id: string) => {
  const { register, unregister, getIsOpen, setIsOpen } = useStackedModal();

  useEffect(() => {
    register(id);
    return () => {
      unregister(id);
    };
  }, [id, register, unregister]);

  const isOpen = getIsOpen(id);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(id, open);
    },
    [id, setIsOpen]
  );

  return { isOpen, handleOpenChange };
};
