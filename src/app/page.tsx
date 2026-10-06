import StoryGeneratorForm from "@/components/story-generator-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-12">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
            Your imagination, illustrated
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            AI Cartoon Story Generator
          </h1>
          <p className="mt-3 text-base leading-7 text-gray-600">
            Tell a story and turn it into a scene plan using the existing cartoon assets.
          </p>
        </div>

        <StoryGeneratorForm />
      </section>
    </main>
  );
}
