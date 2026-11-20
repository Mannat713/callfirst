import { handleCreateOrder } from "@/lib/handlers";

export async function POST(request: Request) {
  return handleCreateOrder(request);
}
