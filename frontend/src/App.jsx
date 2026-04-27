import React from "react";
import { usePathname } from "./hooks/usePathname";
import { parseFirmIdFromPathname } from "./utils/firmUtils";
import SearchPage from "./pages/SearchPage";
import FirmPage from "./pages/FirmPage";
import StarfieldBackground from "./components/StarfieldBackground";

export default function App() {
  const pathname = usePathname();
  const firmId = parseFirmIdFromPathname(pathname);

  return (
    <div className="appShell">
      <StarfieldBackground />
      <div className="appContent">{!firmId ? <SearchPage /> : <FirmPage firmId={firmId} />}</div>
    </div>
  );
}
