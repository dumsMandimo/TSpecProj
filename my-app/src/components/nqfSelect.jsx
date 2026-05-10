import { useNqfLevels } from "../services/api.jsx";

export default function NqfSelect() {
  const { nqfLevel, loading, error } = useNqfLevels();

  if (loading) return <option disabled>Loading...</option>;
  if (error) return <option disabled>Something went wrong.</option>;

  return Object.entries(nqfLevel).map(([key, value]) => {
    if (Array.isArray(value)) {
      return (
        <optgroup key={key} label={key}>
          {value.map((v) => (
            <option key={`${key}-${v}`} value={v}>
              {v}
            </option>
          ))}
        </optgroup>
      );
    }
    return (
      <optgroup key={key} label={key}>
        <option disabled style={{ display: "none" }}></option>
        <option key={key} value={value}>
          {value}
        </option>
      </optgroup>
    );
  });
}
