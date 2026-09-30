import Link from "next/link";
import type { Skill } from "@/db/schema";

export function FilterBar({
  action,
  q,
  skill,
  skills,
  placeholder,
}: {
  action: string;
  q?: string;
  skill?: string;
  skills: Skill[];
  placeholder: string;
}) {
  return (
    <form action={action} method="get" className="filter-bar" role="search">
      <label className="sr-only" htmlFor="q">
        Search
      </label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder={placeholder} className="input input--search" />
      <label className="sr-only" htmlFor="skill">
        Skill
      </label>
      <select id="skill" name="skill" defaultValue={skill ?? ""} className="select">
        <option value="">All skills</option>
        {skills.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="cluster cluster--tight">
        <button type="submit" className="btn btn--primary">
          Search
        </button>
        {(q || skill) && (
          <Link href={action} className="btn btn--ghost">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
