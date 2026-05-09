import type { FlowerCard } from "@/flowers/schema";

export type FlowerCardProposal = {
  id: string;
  title: string;
  description?: string;
  card: FlowerCard;
};

export type FlowerToolStatus = "inProgress" | "executing" | "complete";

export type FlowerToolResponse = (response: string) => void | Promise<void>;
