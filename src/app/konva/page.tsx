import KonvaTestCanvas from "@/components/konva-test-canvas";

export default function KonvaTestPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">
          Konva setup test
        </h1>
        <p className="mt-2 text-gray-600">
          This test page confirms that Konva and React Konva can render a canvas.
        </p>
      </div>
      <KonvaTestCanvas />
    </main>
  );
}
