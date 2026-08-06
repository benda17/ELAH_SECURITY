import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FOUNDER_COOKIE, isFounderSessionToken } from "@/lib/founder-session";

export default async function HomePage() {
  const token = cookies().get(FOUNDER_COOKIE)?.value;
  if (await isFounderSessionToken(token)) {
    redirect("/founder/overview");
  }
  redirect("/login");
}
