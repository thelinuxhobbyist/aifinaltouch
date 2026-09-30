import type { Skill } from "@/db/schema";
import { groupSkills } from "@/lib/queries";
import { FieldError } from "@/components/forms";

export function SkillPicker({
  skills,
  selected = [],
  label,
  hint,
}: {
  skills: Skill[];
  selected?: number[];
  label: string;
  hint?: string;
}) {
  const chosen = new Set(selected);
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {hint && <p className="hint">{hint}</p>}
      <div className="mt-3 space-y-4">
        {groupSkills(skills).map((group) => (
          <div key={group.category}>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{group.category}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.skills.map((s) => (
                <label
                  key={s.id}
                  className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors has-[:checked]:border-brand has-[:checked]:bg-sky has-[:checked]:text-brand-dark has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
                >
                  <input type="checkbox" name="skillIds" value={s.id} defaultChecked={chosen.has(s.id)} className="sr-only" />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <FieldError name="skillIds" />
    </fieldset>
  );
}
