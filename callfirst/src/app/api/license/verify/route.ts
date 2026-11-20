import { handleVerifyLicense } from "@/lib/handlers";

export async function POST(request: Request) {
  return handleVerifyLicense(request);
}
