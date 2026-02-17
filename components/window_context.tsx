import { createContext } from "react";

export const WindowContext = createContext({
  portrait: true,  // Match WindowWithSize default (windowSize undefined = mobile-first)
  rowHeight: 16
})
