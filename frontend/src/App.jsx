import React from "react";
import { usePathname } from "./hooks/usePathname";
import { parseFirmIdFromPathname } from "./utils/firmUtils";
import SearchPage from "./pages/SearchPage";
import FirmPage from "./pages/FirmPage";

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage />;
  return <FirmPage firmId={firmId} />;
}
