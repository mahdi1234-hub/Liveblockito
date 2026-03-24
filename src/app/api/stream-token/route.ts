import { StreamClient } from "@stream-io/node-sdk";
import { currentUser } from "@clerk/nextjs/server";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET_KEY!;

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = new StreamClient(apiKey, secret);

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.emailAddresses[0]?.emailAddress ||
    "Anonymous";

  // Upsert the user in Stream
  await client.upsertUsers([
    {
      id: user.id,
      name: fullName,
      image: user.imageUrl,
    },
  ]);

  // Generate a token valid for 1 hour
  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = client.generateUserToken({
    user_id: user.id,
    exp: expirationTime,
    iat: issuedAt,
  });

  return Response.json({
    token,
    apiKey,
    userId: user.id,
    userName: fullName,
    userImage: user.imageUrl,
  });
}
