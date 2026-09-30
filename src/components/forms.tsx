"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/validation";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>({});

export function ActionForm({
  action,
  children,
  className = "form",
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <FormStateContext.Provider value={state}>
      <form ref={ref} action={formAction} className={className} noValidate>
        {state.error && (
          <p role="alert" className="alert alert--error">
            {state.error}
          </p>
        )}
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function FormSuccess({ children }: { children?: ReactNode }) {
  const state = useContext(FormStateContext);
  if (!state.ok || (!state.message && !children)) return null;
  return (
    <p role="status" className="success-text">
      {state.message ?? children}
    </p>
  );
}

export function FieldError({ name }: { name: string }) {
  const state = useContext(FormStateContext);
  const message = state.fieldErrors?.[name];
  if (!message) return null;
  return (
    <p id={`${name}-error`} className="field-error">
      {message}
    </p>
  );
}

type FieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  defaultValue?: string | null;
  placeholder?: string;
  maxLength?: number;
};

function FieldLabel({ name, label, optional }: { name: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={name} className="label">
      {label}
      {optional && <span className="label__opt">(optional)</span>}
    </label>
  );
}

function useInvalid(name: string) {
  const state = useContext(FormStateContext);
  const invalid = Boolean(state.fieldErrors?.[name]);
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${name}-error` : undefined,
  } as const;
}

export function TextField({ type = "text", ...props }: FieldProps & { type?: string }) {
  const aria = useInvalid(props.name);
  return (
    <div className="field">
      <FieldLabel {...props} />
      {props.hint && <p className="hint">{props.hint}</p>}
      <input
        id={props.name}
        name={props.name}
        type={type}
        defaultValue={props.defaultValue ?? ""}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        className="input"
        {...aria}
      />
      <FieldError name={props.name} />
    </div>
  );
}

export function TextArea({ rows = 4, ...props }: FieldProps & { rows?: number }) {
  const aria = useInvalid(props.name);
  return (
    <div className="field">
      <FieldLabel {...props} />
      {props.hint && <p className="hint">{props.hint}</p>}
      <textarea
        id={props.name}
        name={props.name}
        rows={rows}
        defaultValue={props.defaultValue ?? ""}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        className="textarea"
        {...aria}
      />
      <FieldError name={props.name} />
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  name,
  value,
  block = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  name?: string;
  value?: string;
  block?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`btn btn--${variant}${block ? " btn--block" : ""}`}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
