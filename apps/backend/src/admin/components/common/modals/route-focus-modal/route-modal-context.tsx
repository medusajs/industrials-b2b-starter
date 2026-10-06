import { createContext } from "react";

type RouteModalContextValue = {
  prev: string;
  __internal: {
    closeOnEscape: boolean;
    setCloseOnEscape: (value: boolean) => void;
  };
};

export const RouteModalContext = createContext<RouteModalContextValue | null>(
  null
);
