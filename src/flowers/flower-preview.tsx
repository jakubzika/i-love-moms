import { useFlowerCard } from "@/context/flower-card-context";
import { FlowerCardPreview } from ".";

export function FlowerPreview() {
  const { displayCard } = useFlowerCard();

  return (
    <pre className="overflow-auto whitespace-pre-wrap rounded-lg border ">
      <FlowerCardPreview card={displayCard} />
    </pre>
  );
}
