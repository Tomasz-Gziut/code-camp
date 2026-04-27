import React from "react";
import { usePathname } from "./hooks/usePathname";
import FirmPage from "./pages/FirmPage";
import SearchPage from "./pages/SearchPage";
import { parseFirmIdFromPathname } from "./utils/firmUtils";

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage />;
  return <FirmPage firmId={firmId} />;
}
