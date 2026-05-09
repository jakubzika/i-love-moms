import { useFlowerCard } from "@/context/flower-card-context";
import { FlowerCardPreview } from ".";

export function FlowerPreview() {
  const { displayCard } = useFlowerCard();

  return (
    <pre className="overflow-auto bg-white border shadow-xl">
      <FlowerCardPreview card={displayCard} />
    </pre>
  );
}
