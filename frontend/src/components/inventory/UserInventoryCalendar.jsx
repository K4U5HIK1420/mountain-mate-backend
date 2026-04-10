import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import API from "../../utils/api";
import socket from "../../utils/socket";

const STATUS_CLASS = {
  green: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
  orange: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  red: "border-rose-500/35 bg-rose-500/10 text-rose-200 opacity-75",
};

const toIsoDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export default function UserInventoryCalendar({
  hotelId,
  selectedDate,
  onSelectDate,
  onSelectedInventoryChange,
}) {
  const today = useMemo(() => getToday(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1);
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

  const loadInventory = async () => {
    if (!hotelId) return;
    setLoading(true);
    setError("");
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const effectiveStart = start < today ? today : start;

      if (effectiveStart > end) {
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await API.get(`/inventory/${hotelId}`, {
        params: { startDate: toIsoDate(effectiveStart), endDate: toIsoDate(end) },
      });
      const data = res.data?.data || [];
      setItems(data);
    } catch (_err) {
      setError("Inventory unavailable right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, currentMonth]);

  useEffect(() => {
    const handleUpdate = (payload) => {
      if (String(payload?.hotelId || "") !== String(hotelId || "")) return;
      loadInventory();
    };
    socket.on("inventory:updated", handleUpdate);
    return () => socket.off("inventory:updated", handleUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const selectedDay = useMemo(
    () => items.find((item) => item.date === selectedDate) || null,
    [items, selectedDate]
  );

  useEffect(() => {
    onSelectedInventoryChange?.(selectedDay);
  }, [onSelectedInventoryChange, selectedDay]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-white/70">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
          <Loader2 size={14} className="animate-spin" />
          Loading availability
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Live Pricing Calendar</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">Price + Rooms Available</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-white/65 sm:text-[10px]">
        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-1">Available</span>
        <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-1">Low (&lt;3)</span>
        <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-2 py-1">Sold out</span>
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-2 py-2 sm:px-3">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()}
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/70 hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white sm:text-sm">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="rounded-lg border border-white/10 bg-black/30 p-2 text-white/70 hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase tracking-[0.1em] text-white/45 sm:gap-2 sm:text-[10px]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {monthCells.map((cellDate) => {
          const iso = toIsoDate(cellDate);
          const isPast = iso < todayIso;
          const isCurrentMonth = cellDate.getMonth() === currentMonth.getMonth();
          const item = items.find((row) => row.date === iso) || {
            date: iso,
            price: 0,
            availableRooms: 0,
            isSoldOut: true,
            color: "red",
          };
          const isSelected = selectedDate === item.date;
          const soldOut = item.availableRooms <= 0 || item.isSoldOut;
          if (!isCurrentMonth || isPast) {
            return <div key={iso} className="rounded-lg border border-transparent bg-transparent p-1.5 opacity-0 sm:rounded-xl sm:p-2" aria-hidden="true" />;
          }
          return (
            <button
              key={item.date}
              type="button"
              disabled={soldOut}
              onClick={() => onSelectDate?.(item.date)}
              className={`min-h-[76px] rounded-lg border p-1.5 text-left transition sm:min-h-[92px] sm:rounded-xl sm:p-2 ${
                isSelected ? "border-orange-300 bg-orange-500/15" : STATUS_CLASS[item.color] || "border-white/10 bg-white/5 text-white/70"
              } ${soldOut ? "cursor-not-allowed" : "hover:border-orange-300/45"}`}
            >
              <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${isCurrentMonth ? "text-inherit" : "text-white/35"}`}>{cellDate.getDate()}</p>
              <p className={`mt-1 text-[10px] font-bold sm:text-[11px] ${isCurrentMonth ? "text-inherit" : "text-white/40"}`}>Rs {item.price}</p>
              <p className={`text-[9px] sm:text-[10px] ${isCurrentMonth ? "text-inherit" : "text-white/35"}`}>
                {soldOut ? "Sold out" : item.availableRooms < 3 ? `Only ${item.availableRooms} left` : `${item.availableRooms} rooms`}
              </p>
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <p className="mt-3 text-xs text-orange-200">
          Selected {selectedDay.date}: Rs {selectedDay.price}, {selectedDay.availableRooms} rooms available
        </p>
      ) : null}
    </div>
  );
}
