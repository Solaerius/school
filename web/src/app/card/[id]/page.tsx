import CardDetailClient from "./CardDetailClient";
import { fetchCard } from "../../../lib/api";

export default async function CardPage({ params }: { params: { id: string } }) {
  const card = await fetchCard(params.id);

  return (
    <div style={{ background: "#0b0b0f", minHeight: "100vh" }}>
      <CardDetailClient initialCard={card} />
    </div>
  );
}
