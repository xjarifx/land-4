import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/app/auth-form";
import Dashboard from "@/app/dashboard";

export default async function Home() {
  const user = await getCurrentUser();
  return user ? <Dashboard name={user.name} nid={user.nid} /> : <AuthForm />;
}
