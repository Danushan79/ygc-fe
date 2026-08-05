"use client";

import { ArrowRight, CircleCheck, Loader2, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormBanner } from "@/components/auth/form-banner";
import { FormField } from "@/components/auth/form-field";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { ApiRequestError, signUpRequest } from "@/lib/api/auth-client";
import { isValidEmail } from "@/utils/validation";

type SignUpErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const SIGNIN_REDIRECT_DELAY_MS = 1500;

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);

  function validate(): boolean {
    const nextErrors: SignUpErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function applyServerError(error: ApiRequestError) {
    if (error.status === 400 || error.status === 409) {
      if (/email/i.test(error.message)) {
        setErrors((prev) => ({ ...prev, email: error.message }));
        return;
      }
      if (/password/i.test(error.message)) {
        setErrors((prev) => ({ ...prev, password: error.message }));
        return;
      }
      if (/name/i.test(error.message)) {
        setErrors((prev) => ({ ...prev, fullName: error.message }));
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
      await signUpRequest({ fullName, email, password });
      setIsSignedUp(true);
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

  useEffect(() => {
    if (!isSignedUp) {
      return;
    }

    const timer = setTimeout(() => {
      router.push("/signin");
    }, SIGNIN_REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSignedUp, router]);

  return (
    <AuthShell
      icon={<ShieldPlus className="h-8 w-8 text-blue-800" strokeWidth={2.25} />}
      title="Create Account"
      subtitle="Sign up for Medi Scan"
    >
      {isSignedUp ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CircleCheck className="h-10 w-10 text-emerald-600" strokeWidth={2} />
          <p className="font-semibold text-slate-900">Account created successfully.</p>
          <p className="text-sm text-slate-500">Redirecting you to sign in...</p>
        </div>
      ) : (
        <>
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            {formError && <FormBanner tone="error">{formError}</FormBanner>}

            <FormField
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
              disabled={isSubmitting}
            />

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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              disabled={isSubmitting}
            />

            <FormField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={errors.confirmPassword}
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-blue-800 hover:underline">
              Sign In
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
