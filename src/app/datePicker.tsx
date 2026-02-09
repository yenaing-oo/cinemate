"use client";

type Props = {
  selectedDate: string;
  onSelect: (date: string) => void;
};

const dates = [
  { id: "2026-02-08", label: "Today", sub: "Feb 8" },
  { id: "2026-02-09", label: "Tomorrow", sub: "Feb 9" },
  { id: "2026-02-10", label: "Tuesday", sub: "Feb 10" },
  { id: "2026-02-11", label: "Wednesday", sub: "Feb 11" },
];

export default function DatePicker({ selectedDate, onSelect }: Props) {
  return (
    <div className="d-flex flex-column gap-3">
      <h5 className="fw-semibold">Select date</h5>

      {dates.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className="text-start rounded-4 px-4 py-3 border-0"
          style={{
            background:
              selectedDate === d.id
                ? "linear-gradient(90deg,#20c9ff,#4e7dff)"
                : "rgba(14,30,54,0.6)",
            color: "#fff",
          }}
        >
          <div className="fw-semibold">{d.label}</div>
          <div className="text-white-50">{d.sub}</div>
        </button>
      ))}
    </div>
  );
}
