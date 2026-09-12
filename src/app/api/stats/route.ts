import { jsonError, jsonOk } from "@/lib/api";
import { getDashboardStats } from "@/lib/queries";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return jsonOk(stats);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to load dashboard stats", 500);
  }
}
