"use client";

import { ArrowRight, Loader2, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { ApiRequestError, signInRequest } from "@/lib/api/auth-client";
import { isValidEmail } from "@/utils/validation";

type SignInErrors = {
  email?: string;
  password?: string;
};

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const nextErrors: SignInErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function applyServerError(error: ApiRequestError) {
    if (error.status === 400) {
      if (/email/i.test(error.message)) {
        setErrors((prev) => ({ ...prev, email: error.message }));
        return;
      }
      if (/password/i.test(error.message)) {
        setErrors((prev) => ({ ...prev, password: error.message }));
        return;
      }
    }
    setFormError(error.message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signInRequest({ email, password });
      router.push(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
      return;
    } catch (error) {
      if (error instanceof ApiRequestError) {
        applyServerError(error);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      icon={<ShieldPlus className="h-8 w-8 text-blue-800" strokeWidth={2.25} />}
      title="Welcome back"
      subtitle="Sign in to CliniCore"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <FormField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-blue-800 hover:underline">
          Create Account
        </Link>
      </p>
    </AuthShell>
  );
}
