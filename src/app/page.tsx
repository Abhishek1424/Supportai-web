// The '/' page. It has no content. It only redirects to /dashboard. Flutter idea:
//   `initialRoute` that immediately replaces itself.
import { redirect } from "next/navigation";

/**
 * The bare URL has no content of its own; send visitors to the dashboard
 * (the page guard in proxy.ts will bounce them to /login if not signed in).
 */
export default function Home(): never {
  redirect("/dashboard");
}
