import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RouteModalContext } from "./route-modal-context";

export const useRouteModal = () => {
  const context = useContext(RouteModalContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error("useRouteModal must be used within a RouteModalProvider");
  }

  const handleSuccess = (path?: string) => {
    navigate(path ?? context.prev, { replace: true });
  };

  return {
    handleSuccess,
    setCloseOnEscape: context.__internal.setCloseOnEscape,
    __internal: context.__internal,
  };
};
