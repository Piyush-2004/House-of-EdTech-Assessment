import { getSession } from "@/lib/auth";
import LandingClient from "@/components/LandingClient";

export default async function Home() {
  const user = await getSession();

  return <LandingClient user={user} />;
}
