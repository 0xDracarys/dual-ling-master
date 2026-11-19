import { redirect } from "next/navigation"

// The registration page lives at /auth/register — keep the short URL working.
export default function RegisterRedirectPage() {
  redirect("/auth/register")
}
