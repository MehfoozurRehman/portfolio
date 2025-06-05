import { Route, Routes } from "react-router";

import Landing from "./screens/Landing";

export default function Router() {
  return (
    <Routes>
      <Route path="" element={<Landing />} />
    </Routes>
  );
}
