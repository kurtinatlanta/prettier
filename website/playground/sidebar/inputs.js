import React from "react";

export function Checkbox({ label: _label, checked, onChange }) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={ev => onChange(ev.target.checked)}
      />{" "}
      {_label}
    </label>
  );
}

export function Select({ label: _label, values, selected, onChange }) {
  return (
    <label>
      {_label}{" "}
      <select value={selected} onChange={ev => onChange(ev.target.value)}>
        {values.map(val => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NumberInput({
  label: _label,
  value,
  min,
  max,
  step,
  onChange
}) {
  return (
    <label>
      {_label}{" "}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={ev => onChange(parseInt(ev.target.value, 10))}
      />
    </label>
  );
}
