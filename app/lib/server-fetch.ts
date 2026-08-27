import { cookies } from "next/headers";

export async function serverFetch(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: `token=${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
  return res.json();
}