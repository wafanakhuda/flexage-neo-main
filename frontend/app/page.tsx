import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login screen
  redirect('/login');
  
  // This code won't run due to the redirect, but is needed for TypeScript
  return null;
}
