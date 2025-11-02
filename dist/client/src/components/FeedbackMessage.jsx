import { CheckCircle, XCircle } from "lucide-react";
export default function FeedbackMessage(_a) {
    var isCorrect = _a.isCorrect, explanation = _a.explanation;
    if (isCorrect) {
        return (<div className="bg-success-light border-l-4 border-success p-4 rounded-md mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 !text-[#30ff01]"/>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium !text-[#30ff01]">Correct!</p>
            <p className="mt-2 text-sm !text-[#30ff01]">{explanation}</p>
          </div>
        </div>
      </div>);
    }
    return (<div className="bg-error-light border-l-4 border-error p-4 rounded-md mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 !text-[#ff0000]"/>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium !text-[#ff0000]">Incorrect</p>
          <p className="mt-2 text-sm !text-[#ff0000]">{explanation}</p>
        </div>
      </div>
    </div>);
}
