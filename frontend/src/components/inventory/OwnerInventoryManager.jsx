import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import API from "../../utils/api";
import socket from "../../utils/socket";

const toIsoDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function OwnerInventoryManager({ hotel, notify }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [form, setForm] = useState({
    price: "",
    totalRooms: "",
    rangeDays: "7",
  });

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  const monthCells = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - firstWeekday);

    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [currentMonth]);

  const fetchInventory = async () => {
    if (!hotel?._id) return;
    setLoading(true);
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const res = await API.get(`/inventory/${hotel._id}`, {
        params: { startDate: toIsoDate(startDate), endDate: toIsoDate(end) },
      });
      setInventory(res.data?.data || []);
    } catch {
      notify?.("Inventory load failed.", "error");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel?._id, currentMonth]);

  useEffect(() => {
    const onUpdated = (payload) => {
      if (String(payload?.hotelId || "") !== String(hotel?._id || "")) return;
      fetchInventory();
    };
    socket.on("inventory:updated", onUpdated);
    return () => socket.off("inventory:updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel?._id]);

  const selectionSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const inventoryByDate = useMemo(
    () => new Map(inventory.map((item) => [item.date, item])),
    [inventory]
  );

  const toggleDate = (date) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const applyUpdate = async ({ mode = "selected", soldOut = false } = {}) => {
    if (!hotel?._id) return;
    setUpdating(true);
    try {
      const payload = {
        hotelId: hotel._id,
        markSoldOut: soldOut,
      };

      if (mode === "selected") {
        if (!selectedDates.length) {
          notify?.("Select at least one date.", "error");
          setUpdating(false);
          return;
        }
        payload.dates = selectedDates;
      } else {
        const startDate = toIsoDate(new Date());
        const end = new Date();
        end.setDate(end.getDate() + Math.max(1, Number(form.rangeDays || 1)) - 1);
        payload.startDate = startDate;
        payload.endDate = toIsoDate(end);
      }

      if (form.price !== "") payload.price = Number(form.price);
      if (form.totalRooms !== "") payload.totalRooms = Number(form.totalRooms);

      await API.post("/inventory/update", payload);
      notify?.("Inventory updated.", "success");
      setSelectedDates([]);
      fetchInventory();
    } catch (err) {
      notify?.(err?.response?.data?.message || "Update failed.", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Inventory & Dynamic Pricing</p>
        <span className="text-[10px] text-white/45">{hotel?.hotelName}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" type="number" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
        <input value={form.totalRooms} onChange={(e) => setForm((p) => ({ ...p, totalRooms: e.target.value }))} placeholder="Rooms available" type="number" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
        <input value={form.rangeDays} onChange={(e) => setForm((p) => ({ ...p, rangeDays: e.target.value }))} placeholder="Next N days (optional)" type="number" min="1" max="60" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => applyUpdate({ mode: "selected" })} disabled={updating} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_30px_rgba(249,115,22,0.35)] disabled:opacity-60">
          {updating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Apply Selected
        </button>
        <button onClick={() => applyUpdate({ mode: "selected", soldOut: true })} disabled={updating} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-200">
          {updating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Mark Sold Out
        </button>
        <button onClick={() => applyUpdate({ mode: "range" })} disabled={updating} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80">
          <CalendarDays size={13} /> Apply Next N Days
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/70 hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/70 hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/60">
          <Loader2 size={14} className="animate-spin" /> Loading calendar...
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCells.map((cellDate) => {
            const iso = toIsoDate(cellDate);
            const day = inventoryByDate.get(iso) || {
              date: iso,
              price: Number(hotel?.pricePerNight || 0),
              totalRooms: Number(hotel?.roomsAvailable || 0),
              bookedRooms: 0,
              availableRooms: Number(hotel?.roomsAvailable || 0),
              isSoldOut: false,
            };
            const selected = selectionSet.has(day.date);
            const soldOut = day.availableRooms <= 0 || day.isSoldOut;
            const isCurrentMonth = cellDate.getMonth() === currentMonth.getMonth();
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => toggleDate(day.date)}
                className={`rounded-xl border p-2 text-left transition ${
                  selected ? "border-orange-300 bg-orange-500/15" : soldOut ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : day.availableRooms < 3 ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${isCurrentMonth ? "text-inherit" : "text-white/35"}`}>
                  {cellDate.getDate()}
                </p>
                <p className={`text-[11px] font-bold ${isCurrentMonth ? "text-inherit" : "text-white/40"}`}>Rs {day.price}</p>
                <p className={`text-[10px] ${isCurrentMonth ? "text-inherit" : "text-white/35"}`}>{soldOut ? "Sold out" : `${day.availableRooms} left`}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
