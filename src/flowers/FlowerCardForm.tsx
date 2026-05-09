"use client";

import { FlowerCardPreview } from "./index";
import { FLOWER_PRESETS, type FlowerCard } from "./schema";

const dummyCard: FlowerCard = {
  content: {
    htmlContent:
      "<h2>Happy Mother's Day, Mom! 🌹</h2><p>Thanks for everything.</p>",
  },
  bouquet: {
    flowers: [
      { ...FLOWER_PRESETS.redRose, quantity: 7 },
      { ...FLOWER_PRESETS.babysBreath, quantity: 12 },
    ],
  },
};

export default function FlowerCardForm() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <FlowerCardPreview card={dummyCard} />
    </div>
  );
}
