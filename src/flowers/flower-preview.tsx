import { useFlowerCard } from "@/context/flower-card-context";

export function FlowerPreview() {
  const { displayCard } = useFlowerCard();

  return (
    <pre className="max-h-[80vh] max-w-2xl overflow-auto whitespace-pre-wrap rounded-lg border bg-white p-6 text-sm leading-6 text-neutral-900 shadow-sm">
      {JSON.stringify(displayCard, null, 2)}
    </pre>
  );
}
