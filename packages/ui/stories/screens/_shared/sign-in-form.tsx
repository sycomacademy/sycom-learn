import { useState } from "react";
import { buttonVariants } from "../../../src/components/button-variants";
import { Button } from "../../../src/components/button";
import { Input } from "../../../src/components/input";
import { Label } from "../../../src/components/label";

export function SignInForm({
  onSubmit,
}: {
  onSubmit?: (values: { email: string; password: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email address";
    if (!password || password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    onSubmit?.({ email, password });
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
  }

  return (
    <div className="w-full">
      <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <a
          href="#sign-up"
          className={buttonVariants({
            variant: "link",
            className: "text-indigo-600 hover:text-indigo-800",
          })}
        >
          Need an account? Sign Up
        </a>
      </div>
    </div>
  );
}
