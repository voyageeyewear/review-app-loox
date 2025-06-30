import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  console.log("🧪 Test webhook - always returns 401");
  return new Response("Unauthorized", { status: 401 });
} 