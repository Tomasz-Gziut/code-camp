import React from "react";
import { MOCK_FIRMS } from "./data/mockFirms";
import { usePathname } from "./hooks/usePathname";
import FirmPage from "./pages/FirmPage";
import SearchPage from "./pages/SearchPage";
import { parseFirmIdFromPathname } from "./utils/firmUtils";

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  if (!firmId) return <SearchPage firms={MOCK_FIRMS} />;

  const firm = MOCK_FIRMS.find((f) => f.id === firmId) ?? null;
  return <FirmPage firm={firm} />;
}
