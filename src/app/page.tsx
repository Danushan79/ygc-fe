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
    <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-blue-50/60 via-[#f7f8fc] to-[#f7f8fc]">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
        aria-hidden
      >
        <div className="aspect-[1155/678] w-[72rem] flex-none bg-gradient-to-tr from-blue-300 via-indigo-200 to-sky-200 opacity-30" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-900/20 sm:h-12 sm:w-12">
            <SquareActivity className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
          </span>
          <h1 className="bg-gradient-to-br from-blue-800 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            CliniCore
          </h1>
        </div>

        <h2 className="mt-7 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Clarity for your medical records.
        </h2>

        <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          Upload your medical reports and get AI-powered summaries, medication timelines, and
          conflict detection instantly. Designed for patients and professionals seeking precise,
          actionable health insights.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/signin"
            className="rounded-xl bg-gradient-to-b from-blue-700 to-blue-800 px-8 py-3 text-center font-semibold text-white shadow-lg shadow-blue-900/25 transition-all hover:shadow-xl hover:shadow-blue-900/30 hover:brightness-105 active:brightness-95"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-24">
        <h3 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          How it works
        </h3>

        <div className="mt-10 flex flex-col items-stretch gap-6 md:flex-row">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-1 items-stretch">
              <div className="flex flex-1 flex-col items-center rounded-2xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm ring-1 ring-slate-900/[0.02] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <step.icon className="h-7 w-7 text-blue-700" strokeWidth={2} />
                </div>
                <h4 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h4>
                <p className="mt-2 text-sm text-slate-500">{step.description}</p>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className="mt-14 hidden h-px w-8 flex-shrink-0 self-start bg-gradient-to-r from-slate-300 to-transparent md:block"
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
