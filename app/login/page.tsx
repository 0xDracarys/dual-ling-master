import { redirect } from "next/navigation"

// The sign-in page lives at /auth/login — keep the short URL working.
export default function LoginRedirectPage() {
  redirect("/auth/login")
}
