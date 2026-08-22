import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTenantInfo, getTenantServices, getAvailability, createAppointment } from "../lib/api";
import { toDateParam, formatFullDate, formatTime } from "../lib/format";
import ProgressSteps from "../components/ProgressSteps";
import ServiceList from "../components/ServiceList";
import DateStrip from "../components/DateStrip";
import TimeSlotGrid from "../components/TimeSlotGrid";
import NotFound from "./NotFound";

export default function Booking() {
  const { slug } = useParams();

  const [step, setStep] = useState("service");
  const [services, setServices] = useState(null); // null = carregando, [] = vazio
  const [tenantMissing, setTenantMissing] = useState(false);
  const [timezone, setTimezone] = useState("America/Fortaleza"); // fallback até a info do tenant chegar

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    getTenantInfo(slug)
      .then((info) => setTimezone(info.timezone))
      .catch(() => {}); // se falhar, mantém o fallback - a checagem de 404 real acontece na chamada de services abaixo

    getTenantServices(slug)
      .then(setServices)
      .catch((err) => {
        if (err.response?.status === 404) setTenantMissing(true);
      });
  }, [slug]);

  useEffect(() => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAvailability(slug, selectedService.id, toDateParam(selectedDate))
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [slug, selectedService, selectedDate]);

  if (tenantMissing) return <NotFound />;

  async function handleConfirm(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const appointment = await createAppointment(slug, {
        serviceId: selectedService.id,
        startsAt: selectedSlot.startsAt,
        client: { name, phone },
      });
      setConfirmedAppointment(appointment);
      setStep("done");
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === "SLOT_UNAVAILABLE" || code === "SLOT_BLOCKED") {
        setSubmitError("Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário.");
        setStep("datetime");
        setSelectedSlot(null);
      } else {
        setSubmitError("Não foi possível confirmar o agendamento. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--color-canvas) flex justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="font-display italic text-3xl text-(--color-ink)">Belora</h1>
          <p className="text-(--color-ink-soft) text-sm mt-1">Agende seu horário</p>
        </header>

        {step !== "done" && <ProgressSteps current={step} />}

        {services === null ? (
          <p className="text-sm text-(--color-ink-soft) text-center py-12">Carregando...</p>
        ) : (
          <>
            {step === "service" && (
              <ServiceList
                services={services}
                onSelect={(service) => {
                  setSelectedService(service);
                  setStep("datetime");
                }}
              />
            )}

            {step === "datetime" && selectedService && (
              <div>
                <button
                  onClick={() => setStep("service")}
                  className="text-xs text-(--color-ink-soft) hover:text-(--color-ink) mb-4"
                >
                  ← Trocar serviço
                </button>

                <div className="rounded-xl bg-(--color-lilac-soft) px-4 py-3 mb-5">
                  <p className="text-sm font-medium text-(--color-ink)">{selectedService.name}</p>
                  <p className="text-xs text-(--color-ink-soft)">
                    {selectedService.durationMin} min · R$ {Number(selectedService.price).toFixed(2)}
                  </p>
                </div>

                <p className="text-xs font-medium text-(--color-ink-soft) mb-2">Escolha o dia</p>
                <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

                <p className="text-xs font-medium text-(--color-ink-soft) mt-5 mb-2">
                  {formatFullDate(selectedDate)}
                </p>
                <TimeSlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                  loading={loadingSlots}
                  timezone={timezone}
                />

                {selectedSlot && (
                  <button
                    onClick={() => setStep("details")}
                    className="w-full mt-6 rounded-lg bg-(--color-ink) text-white text-sm font-medium py-3 hover:bg-(--color-ink)/90 transition-colors"
                  >
                    Continuar
                  </button>
                )}
              </div>
            )}

            {step === "details" && selectedService && selectedSlot && (
              <div>
                <button
                  onClick={() => setStep("datetime")}
                  className="text-xs text-(--color-ink-soft) hover:text-(--color-ink) mb-4"
                >
                  ← Trocar horário
                </button>

                <div className="rounded-xl bg-(--color-lilac-soft) px-4 py-3 mb-5">
                  <p className="text-sm font-medium text-(--color-ink)">{selectedService.name}</p>
                  <p className="text-xs text-(--color-ink-soft)">
                    {formatFullDate(selectedDate)} às {formatTime(selectedSlot.startsAt, timezone)}
                  </p>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
                      Seu nome
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm bg-(--color-surface) outline-none focus:border-(--color-clay)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+55 85 90000-0000"
                      className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm bg-(--color-surface) outline-none focus:border-(--color-clay)"
                    />
                    <p className="text-[11px] text-(--color-ink-soft) mt-1">
                      Usamos para confirmar e lembrar do seu horário.
                    </p>
                  </div>

                  {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-3 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Confirmando..." : "Confirmar agendamento"}
                  </button>
                </form>
              </div>
            )}

            {step === "done" && confirmedAppointment && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-(--color-sage-soft) text-(--color-sage) flex items-center justify-center text-2xl mx-auto mb-5">
                  ✓
                </div>
                <h2 className="font-display text-xl text-(--color-ink) mb-1">Agendamento confirmado</h2>
                <p className="text-sm text-(--color-ink-soft) mb-6">
                  {selectedService.name} · {formatFullDate(selectedDate)} às{" "}
                  {formatTime(confirmedAppointment.startsAt, timezone)}
                </p>
                <p className="text-xs text-(--color-ink-soft)">
                  Você vai receber a confirmação no WhatsApp informado.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
