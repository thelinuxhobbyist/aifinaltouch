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
    <fieldset className="field">
      <legend className="label">{label}</legend>
      {hint && <p className="hint">{hint}</p>}
      <div className="stack stack--sm mt-2">
        {groupSkills(skills).map((group) => (
          <div key={group.category} className="stack stack--xs">
            <p className="label-caps">{group.category}</p>
            <div className="chips">
              {group.skills.map((s) => (
                <label key={s.id} className="chip">
                  <input type="checkbox" name="skillIds" value={s.id} defaultChecked={chosen.has(s.id)} />
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
