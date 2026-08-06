import { CheckCircle, XCircle } from "lucide-react";

interface FeedbackMessageProps {
  isCorrect: boolean;
  explanation: string;
  aiTell?: string;
}

export default function FeedbackMessage({ isCorrect, explanation, aiTell }: FeedbackMessageProps) {
  const styles = isCorrect
    ? { wrap: "bg-emerald-50 border-emerald-400", text: "text-emerald-800", Icon: CheckCircle, label: "Correct!" }
    : { wrap: "bg-red-50 border-red-400", text: "text-red-800", Icon: XCircle, label: "Not quite" };

  const { Icon } = styles;

  return (
    <div className={`${styles.wrap} border-l-4 p-4 rounded-md mb-6`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.text}`} />
        </div>
        <div className="ml-3 space-y-2">
          <p className={`text-sm font-medium ${styles.text}`}>{styles.label}</p>
          {explanation && (
            <p className={`text-sm ${styles.text}`}>
              <span className="font-medium">The real one:</span> {explanation}
            </p>
          )}
          {aiTell && (
            <p className={`text-sm ${styles.text}`}>
              <span className="font-medium">One AI tell:</span> {aiTell}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
