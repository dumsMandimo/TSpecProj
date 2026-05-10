import { useState, useRef, useEffect } from "react";

const NQF_LEVELS = [
  { group: "NQF 1", options: ["General Certificate"] },
  { group: "NQF 2", options: ["Elementary Certificate"] },
  { group: "NQF 3", options: ["Intermediate Certificate"] },
  { group: "NQF 4", options: ["National Certificate"] },
  { group: "NQF 5", options: ["Higher Certificate"] },
  { group: "NQF 6", options: ["Diploma", "Advanced Certificate"] },
  { group: "NQF 7", options: ["Bachelor's Degree", "Advanced Diploma"] },
  {
    group: "NQF 8",
    options: ["Bachelor Honours Degree", "Postgraduate Diploma"],
  },
  {
    group: "NQF 9",
    options: ["Master's Degree", "Master's Degree (Professional)"],
  },
  {
    group: "NQF 10",
    options: ["Doctoral Degree", "Doctoral Degree (Professional)"],
  },
];

export default function NqfDropdown({ value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (name, group) => {
    const value = `${name} (${group})`;

    setSelected({ name, group });

    onChange({
      target: {
        value,
      },
    });

    setOpen(false);
  };

  return (
    <section ref={ref} className="nqf-dropdown">
      <input
        type="text"
        required={required}
        value={value}
        readOnly
        style={{ display: "none" }}
      />

      <button
        type="button"
        className={`nqf-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? "" : "placeholder"}>
          {selected
            ? `${selected.name} (${selected.group})`
            : "Select NQF level"}
        </span>
        <span className="nqf-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="nqf-list">
          {NQF_LEVELS.map(({ group, options }) => (
            <li key={group}>
              <p className="nqf-group-label">{group}</p>
              {options.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`nqf-option ${selected?.name === name ? "selected" : ""}`}
                  onClick={() => pick(name, group)}
                >
                  {name}
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
