const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ugvdxfdpxrwsqseodquo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type EventsFunctionResponse = {
  message: string;
};

export async function invokeEventsFunction(
  name = "Baby Map",
): Promise<EventsFunctionResponse | null> {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add your Supabase publishable key to frontend/.env.local",
    );
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/events`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    console.error(
      "Supabase events function failed",
      response.status,
      await response.text(),
    );
    return null;
  }

  const data = (await response.json()) as EventsFunctionResponse;
  console.log(data.message);
  return data;
}
