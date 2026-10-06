import { PropsWithChildren, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteModalContext } from "./route-modal-context";

type RouteModalProviderProps = PropsWithChildren<{
  prev?: string;
}>;

export const RouteModalProvider = ({
  prev = "..",
  children,
}: RouteModalProviderProps) => {
  const navigate = useNavigate();
  const [closeOnEscape, setCloseOnEscape] = useState(true);

  const handleSuccess = (path?: string) => {
    navigate(path ?? prev, { replace: true });
  };

  return (
    <RouteModalContext.Provider
      value={{
        prev,
        __internal: {
          closeOnEscape,
          setCloseOnEscape,
        },
      }}
    >
      {children}
    </RouteModalContext.Provider>
  );
};
