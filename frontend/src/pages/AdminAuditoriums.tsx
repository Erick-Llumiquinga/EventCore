import React, { useEffect, useState, useCallback } from "react";
import {
  catalogApi,
  type CatalogAuditoriumDto,
  type CatalogCinemaDto,
} from "../api/catalog";
import {
  Building2,
  Plus,
  Armchair,
  MapPin,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  ShieldCheck,
  X,
} from "lucide-react";
import axios from "axios";

const CAPACITY_PRESETS = [15, 30, 50, 80, 120];

export const AdminAuditoriums: React.FC = () => {
  const [cinemas, setCinemas] = useState<CatalogCinemaDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | "">("");
  const [name, setName] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("40");
  const [editingAuditorium, setEditingAuditorium] =
    useState<CatalogAuditoriumDto | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCinemasAndAuditoriums = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await catalogApi.getCinemas({ per_page: 50 });
      setCinemas(result.cinemas);
      if (result.cinemas.length > 0 && selectedCinemaId === "") {
        setSelectedCinemaId(result.cinemas[0].id);
      }
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los cines y salas.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCinemaId]);

  useEffect(() => {
    fetchCinemasAndAuditoriums();
  }, [fetchCinemasAndAuditoriums]);

  const resetForm = () => {
    setName("");
    setCapacity("40");
    setEditingAuditorium(null);
    setFormError(null);
  };

  const handleStartEdit = (auditorium: CatalogAuditoriumDto) => {
    setEditingAuditorium(auditorium);
    setSelectedCinemaId(auditorium.cinema_id);
    setName(auditorium.name);
    setCapacity(String(auditorium.capacity));
    setFormError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const parsedCapacity = Number(capacity);
    if (!selectedCinemaId) {
      setFormError("Debes seleccionar un cine.");
      return;
    }
    if (!name.trim()) {
      setFormError("Ingresa el nombre de la sala.");
      return;
    }
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      setFormError("La capacidad debe ser un número entero mayor a 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingAuditorium) {
        await catalogApi.updateAuditorium(editingAuditorium.id, {
          name: name.trim(),
          capacity: parsedCapacity,
        });
        setSuccessMsg(`Sala "${name.trim()}" actualizada correctamente.`);
      } else {
        await catalogApi.createAuditorium({
          cinema_id: Number(selectedCinemaId),
          name: name.trim(),
          capacity: parsedCapacity,
        });
        setSuccessMsg(`Sala "${name.trim()}" creada exitosamente.`);
      }

      resetForm();
      await fetchCinemasAndAuditoriums();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Ocurrió un error al guardar la sala.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (auditorium: CatalogAuditoriumDto) => {
    setFormError(null);
    setSuccessMsg(null);
    setDeletingId(auditorium.id);

    try {
      await catalogApi.deleteAuditorium(auditorium.id);
      setSuccessMsg(`Sala "${auditorium.name}" eliminada correctamente.`);
      if (editingAuditorium?.id === auditorium.id) {
        resetForm();
      }
      await fetchCinemasAndAuditoriums();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(
          "No se pudo eliminar la sala (verifica que no tenga funciones activas).",
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C7AA78]/15 border border-[#C7AA78]/35 text-[#C7AA78] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exclusivo Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administración de Salas
          </h1>
          <p className="text-xs sm:text-sm text-[#F2F0EB]/65">
            Crea, edita y administra las salas de proyección para cada cine de
            EventCore.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-300/70 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {formError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-red-300/70 hover:text-red-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create / Edit Auditorium Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78]">
                  {editingAuditorium ? (
                    <Pencil className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    {editingAuditorium ? "Editar Sala" : "Nueva Sala"}
                  </h2>
                  <p className="text-xs text-[#F2F0EB]/60">
                    {editingAuditorium
                      ? `Modificando ID #${editingAuditorium.id}`
                      : "Completa los datos para registrar la sala"}
                  </p>
                </div>
              </div>

              {editingAuditorium && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-[#F2F0EB]/60 hover:text-white underline cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Select Cinema */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#F2F0EB]/85">
                  Cine asignado
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#C7AA78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    disabled={Boolean(editingAuditorium) || cinemas.length === 0}
                    value={selectedCinemaId}
                    onChange={(e) =>
                      setSelectedCinemaId(Number(e.target.value))
                    }
                    className="w-full appearance-none pl-10 pr-10 py-3 rounded-xl bg-[#222429] border border-white/10 text-sm text-white font-medium focus:outline-none focus:border-[#C7AA78] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {cinemas.length === 0 ? (
                      <option value="">Cargando cines...</option>
                    ) : (
                      cinemas.map((cinema) => (
                        <option
                          key={cinema.id}
                          value={cinema.id}
                          className="bg-[#202124] text-[#F2F0EB]"
                        >
                          {cinema.name} ({cinema.city})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#F2F0EB]/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Auditorium Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#F2F0EB]/85">
                  Nombre de la Sala
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#C7AA78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Sala 3 — IMAX / Sala VIP 4D"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#F2F0EB]/85">
                  Capacidad (Número de asientos)
                </label>
                <div className="relative">
                  <Armchair className="w-4 h-4 text-[#C7AA78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={100000}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="40"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                  />
                </div>

                {/* Quick Capacity Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-[#F2F0EB]/55">
                    Rápido:
                  </span>
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCapacity(String(preset))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        Number(capacity) === preset
                          ? "bg-[#C7AA78]/20 border-[#C7AA78] text-[#C7AA78]"
                          : "bg-[#222429] border-white/10 text-[#F2F0EB]/70 hover:text-white"
                      }`}
                    >
                      {preset} asientos
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-50 disabled:cursor-not-allowed text-[#1c1d21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando sala...</span>
                  </>
                ) : editingAuditorium ? (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Crear Sala</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Existing Auditoriums Grouped by Cinema */}
        <div className="lg:col-span-7 space-y-5">
          {isLoading ? (
            <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-[#F2F0EB]/70">
              <Loader2 className="w-8 h-8 text-[#C7AA78] animate-spin" />
              <span className="text-sm">Cargando cines y salas...</span>
            </div>
          ) : loadError ? (
            <div className="bg-[#1b1c20] border border-red-500/30 rounded-3xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm text-red-300">{loadError}</p>
            </div>
          ) : cinemas.length === 0 ? (
            <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-8 text-center text-sm text-[#F2F0EB]/65">
              No hay cines registrados en el catálogo.
            </div>
          ) : (
            cinemas.map((cinema) => {
              const rooms = cinema.auditoriums || [];
              return (
                <div
                  key={cinema.id}
                  className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4"
                >
                  {/* Cinema Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78] shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">
                          {cinema.name}
                        </h3>
                        <p className="text-xs text-[#F2F0EB]/60">
                          {cinema.address} &bull;{" "}
                          <span className="text-[#C7AA78] font-semibold">
                            {cinema.city}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-[#222429] border border-white/10 text-xs font-bold text-[#C7AA78] shrink-0">
                      {rooms.length} {rooms.length === 1 ? "sala" : "salas"}
                    </span>
                  </div>

                  {/* Rooms List */}
                  {rooms.length === 0 ? (
                    <p className="text-xs text-[#F2F0EB]/55 py-2">
                      Este cine aún no tiene salas creadas.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className="bg-[#222429] border border-white/10 hover:border-[#C7AA78]/40 rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {room.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#F2F0EB]/45">
                                #{room.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#C7AA78] font-semibold">
                              <Armchair className="w-3.5 h-3.5" />
                              <span>{room.capacity} asientos</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleStartEdit({
                                  ...room,
                                  cinema_id: cinema.id,
                                })
                              }
                              title="Editar sala"
                              className="p-2 rounded-xl bg-[#1b1c20] border border-white/10 hover:border-[#C7AA78] text-[#F2F0EB]/75 hover:text-[#C7AA78] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === room.id}
                              onClick={() => handleDelete(room)}
                              title="Eliminar sala"
                              className="p-2 rounded-xl bg-[#1b1c20] border border-white/10 hover:border-red-400/50 text-[#F2F0EB]/75 hover:text-red-400 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              {deletingId === room.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
