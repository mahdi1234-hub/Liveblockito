import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Authenticating your Liveblocks application
 * https://liveblocks.io/docs/authentication
 */

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  // Get the current authenticated Clerk user
  const user = await currentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress ||
    "Anonymous";

  // Create a session for the current user
  // userInfo is made available in Liveblocks presence hooks, e.g. useOthers
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: fullName,
      color: getColorFromId(user.id),
      avatar: user.imageUrl,
    },
  });

  // Use a naming pattern to allow access to rooms with a wildcard
  session.allow(`liveblocks:examples:*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { body, status } = await session.authorize();
  return new Response(body, { status });
}

// Generate a consistent color based on user ID
function getColorFromId(id: string): string {
  const colors = [
    "#D583F0",
    "#F08385",
    "#F0D885",
    "#85EED6",
    "#85BBF0",
    "#8594F0",
    "#85DBF0",
    "#87EE85",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
