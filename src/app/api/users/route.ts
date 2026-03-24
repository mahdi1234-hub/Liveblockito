import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userIds = searchParams.getAll("userIds");

  if (!userIds || !Array.isArray(userIds)) {
    return new NextResponse("Missing or invalid userIds", { status: 400 });
  }

  const client = await clerkClient();
  const users = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const user = await client.users.getUser(userId);
        const fullName =
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.emailAddresses[0]?.emailAddress ||
          "Anonymous";
        return {
          name: fullName,
          avatar: user.imageUrl,
        };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json(users, { status: 200 });
}
