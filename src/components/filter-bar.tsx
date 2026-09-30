import Link from "next/link";
import type { Skill } from "@/db/schema";

export function FilterBar({
  action,
  q,
  skill,
  location,
  locationName,
  locationOptions,
  skills,
  placeholder,
}: {
  action: string;
  q?: string;
  skill?: string;
  location?: string;
  locationName: string;
  locationOptions: { value: string; label: string }[];
  skills: Skill[];
  placeholder: string;
}) {
  const active = Boolean(q || skill || location);
  return (
    <form action={action} method="get" className="grid gap-3 py-6 sm:grid-cols-[1fr_200px_170px_auto]" role="search">
      <label className="sr-only" htmlFor="q">
        Search
      </label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder={placeholder} className="input mt-0" />
      <label className="sr-only" htmlFor="skill">
        Skill
      </label>
      <select id="skill" name="skill" defaultValue={skill ?? ""} className="input mt-0">
        <option value="">All skills</option>
        {skills.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={locationName}>
        Location
      </label>
      <select id={locationName} name={locationName} defaultValue={location ?? ""} className="input mt-0">
        {locationOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1 sm:flex-none">
          Search
        </button>
        {active && (
          <Link href={action} className="btn-ghost">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
