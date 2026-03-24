import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns a list of user IDs from a partial search input
 * For `resolveMentionSuggestions` in liveblocks.config.ts
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";

  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 20 });

  const filteredUserIds = users.data
    .filter((user) => {
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.emailAddresses[0]?.emailAddress ||
        "";
      return fullName.toLowerCase().includes(text.toLowerCase());
    })
    .map((user) => user.id);

  return NextResponse.json(filteredUserIds);
}
