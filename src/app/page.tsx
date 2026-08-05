import { Brain, ChartSpline, FileUp, SquareActivity } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: FileUp,
    title: "1. Upload",
    description:
      "Securely upload your PDFs, images, or raw text medical records to our encrypted vault.",
  },
  {
    icon: Brain,
    title: "2. Analyze",
    description:
      "Our specialized medical AI extracts key entities, timelines, and identifies potential medication conflicts.",
  },
  {
    icon: ChartSpline,
    title: "3. Understand",
    description:
      "Review clear, structured summaries and interactive timelines to better manage your health.",
  },
];

export default function Home() {
  return (
    <div className="relative flex-1 overflow-hidden bg-[#f5f6fb]">
      <span
        aria-hidden
        className="pointer-events-none absolute top-6 left-0 -translate-x-1/4 text-7xl font-extrabold whitespace-nowrap text-blue-900/5 select-none sm:text-8xl"
      >
        Medi Scan
      </span>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28">
        <div className="flex items-center gap-3">
          <SquareActivity className="h-9 w-9 text-blue-800 sm:h-10 sm:w-10" strokeWidth={2.25} />
          <h1 className="text-3xl font-extrabold text-blue-800 sm:text-4xl">Medi Scan</h1>
        </div>

        <h2 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          Clarity for your medical records.
        </h2>

        <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          Upload your medical reports and get AI-powered summaries, medication timelines, and
          conflict detection instantly. Designed for patients and professionals seeking precise,
          actionable health insights.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/signin"
            className="rounded-lg bg-blue-900 px-8 py-3 text-center font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            Sign In
          </Link>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-8 py-3 font-semibold text-blue-900 transition-colors hover:bg-slate-50"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-24">
        <h3 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h3>

        <div className="mt-10 flex flex-col items-stretch gap-6 md:flex-row">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-1 items-stretch">
              <div className="flex flex-1 flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <step.icon className="h-7 w-7 text-blue-700" strokeWidth={2} />
                </div>
                <h4 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h4>
                <p className="mt-2 text-sm text-slate-500">{step.description}</p>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className="mt-14 hidden h-px w-8 flex-shrink-0 self-start bg-slate-300 md:block"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
