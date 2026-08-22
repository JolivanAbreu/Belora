import { Routes, Route } from "react-router-dom";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<Booking />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
