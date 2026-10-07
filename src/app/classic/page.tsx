import StoryGeneratorForm from "@/components/story-generator-form";
import Link from "next/link";

export default function ClassicEditorPage() {
  return (
    <main className="min-h-screen bg-slate-100/70 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto mb-5 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          ← Back to AI storybook creator
        </Link>
      </div>
      <StoryGeneratorForm />
    </main>
  );
}
