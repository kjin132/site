// src/components/PartCardRow.jsx
import PartCard from "./PartCard";
import { PARTS } from "../utils/status";

export default function PartCardRow({ data, peaks, prevPoint }) {
  return (
    <div className="card-row">
      {PARTS.map((part) => (
        <PartCard
          key={part.key}
          part={part}
          temp={data?.[part.key]}
          status={data?.[`${part.key}_status`]}
          predict={data?.[`${part.key}_predict`]}
          peak={peaks?.[part.key]}
          prevTemp={prevPoint?.[part.key]}
        />
      ))}
    </div>
  );
}
