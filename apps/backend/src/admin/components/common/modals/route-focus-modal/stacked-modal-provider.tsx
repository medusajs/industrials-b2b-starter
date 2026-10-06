import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { StackedModalContext } from "./stacked-modal-context";

type StackedModalProviderProps = PropsWithChildren<{
  onOpenChange?: (open: boolean) => void;
}>;

export const StackedModalProvider = ({
  onOpenChange,
  children,
}: StackedModalProviderProps) => {
  const [stack, setStack] = useState<Map<string, boolean>>(new Map());

  const register = useCallback((id: string) => {
    setStack((prev) => new Map(prev).set(id, false));
  }, []);

  const unregister = useCallback((id: string) => {
    setStack((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getIsOpen = useCallback(
    (id: string) => {
      return stack.get(id) ?? false;
    },
    [stack]
  );

  const setIsOpen = useCallback((id: string, isOpen: boolean) => {
    setStack((prev) => new Map(prev).set(id, isOpen));
  }, []);

  useEffect(() => {
    const isAnyOpen = Array.from(stack.values()).some((isOpen) => isOpen);
    onOpenChange?.(isAnyOpen);
  }, [stack, onOpenChange]);

  return (
    <StackedModalContext.Provider
      value={{
        register,
        unregister,
        getIsOpen,
        setIsOpen,
      }}
    >
      {children}
    </StackedModalContext.Provider>
  );
};
