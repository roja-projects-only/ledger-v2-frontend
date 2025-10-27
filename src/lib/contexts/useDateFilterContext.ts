import { useContext } from "react";
import { DateFilterContext } from "./dateFilterContextBase";

export function useDateFilterContext() {
  const context = useContext(DateFilterContext);

  if (context === undefined) {
    throw new Error("useDateFilterContext must be used within DateFilterProvider");
  }

  return context;
}
