
"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : "Unable to log in. Check your credentials."
        );
      }

      localStorage.setItem("campusfind_token", data.access_token);

      // Notify the global Navbar that the user has logged in.
      window.dispatchEvent(new Event("campusfind-auth-change"));

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err.message || "Could not connect to the CampusFind server."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <Link
          href="/"
          className="text-xl font-bold text-blue-700 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          CampusFind
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Log in to your CampusFind account.
        </p>

        {searchParams.get("registered") === "1" && (
          <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            Account created! You can log in now.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={`${inputClass} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.3 4.5 9 7-.3 1.1-1 2.2-1.8 3.1" />
                    <path d="M6.2 6.2C3.8 7.7 2.4 10 2 12c.7 2.5 4 7 10 7 1.2 0 2.3-.2 3.3-.6" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          New to CampusFind?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Create an account
          </Link>
        </p>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center dark:border-slate-700">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            ← Back to CampusFind Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 transition-colors dark:bg-slate-950 dark:text-slate-300">
          Loading login...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
