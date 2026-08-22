import { Resend } from "resend";

export const POST = async (request: Request) => {
  const { email } = await request.json();
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return Response.json(
      { error: "Newsletter is not configured" },
      { status: 503 },
    );
  }

  // Create contact
  try {
    const resend = new Resend(apiKey);

    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Error subscribing to updates" },
      { status: 400 },
    );
  }
};
