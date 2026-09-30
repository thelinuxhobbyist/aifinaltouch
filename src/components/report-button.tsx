import Link from "next/link";
import { submitReport } from "@/app/report-actions";
import { ActionForm, FormSuccess, SubmitButton, TextArea } from "@/components/forms";

export function ReportButton({
  targetType,
  targetId,
  signedIn,
  label = "Report",
}: {
  targetType: "profile" | "request" | "message";
  targetId: string;
  signedIn: boolean;
  label?: string;
}) {
  if (!signedIn) {
    return (
      <Link href="/sign-in" className="text-xs text-muted hover:text-ink hover:underline">
        {label}
      </Link>
    );
  }
  return (
    <details className="group text-xs">
      <summary className="cursor-pointer list-none text-muted hover:text-ink hover:underline [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <ActionForm action={submitReport} resetOnSuccess className="mt-3 max-w-md space-y-3 rounded-md border border-line bg-white p-4 text-sm">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <TextArea name="reason" label="What's the problem?" rows={3} maxLength={1000} />
        <div className="flex items-center gap-3">
          <SubmitButton variant="secondary" pendingLabel="Sending…">
            Send report
          </SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>
    </details>
  );
}
