import { Routes, Route } from "react-router-dom";
import Booking from "./pages/Booking";
import CancelAppointment from "./pages/CancelAppointment";
import ConfirmPresence from "./pages/ConfirmPresence";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/:slug/cancelar/:appointmentId" element={<CancelAppointment />} />
      <Route path="/:slug/confirmar/:appointmentId" element={<ConfirmPresence />} />
      <Route path="/:slug" element={<Booking />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
