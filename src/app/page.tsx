import StoryGeneratorForm from "@/components/story-generator-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-violet-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-xl shadow-md shadow-violet-500/20">
              🎨
            </span>
            <div>
              <span className="font-bold text-slate-900">AI Cartoon Story</span>
              <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                MVP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Predefined Assets</span>
            <span>•</span>
            <span>Konva Canvas</span>
            <span>•</span>
            <span>PDF/PNG Export</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StoryGeneratorForm />
      </div>
    </main>
  );
}
