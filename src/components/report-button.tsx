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
      <Link href="/sign-in" className="text-btn text-btn--muted">
        {label}
      </Link>
    );
  }
  return (
    <details>
      <summary className="disclosure text-btn text-btn--muted">
        {label}
      </summary>
      <ActionForm action={submitReport} resetOnSuccess className="panel stack stack--sm mt-3">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <TextArea name="reason" label="What's the problem?" rows={3} maxLength={1000} />
        <div className="cluster">
          <SubmitButton variant="secondary" pendingLabel="Sending…">
            Send report
          </SubmitButton>
          <FormSuccess />
        </div>
      </ActionForm>
    </details>
  );
}
