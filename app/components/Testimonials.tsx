import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

export default function Testimonials() {
  const testimonials = useQuery(api.testimonials.get);

  console.log("Testimonials:", testimonials);
  return <div>Testimonials</div>;
}
