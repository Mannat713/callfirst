import { handleVerifyPayment } from "@/lib/handlers";

export async function POST(request: Request) {
  return handleVerifyPayment(request);
}
