"use client";

import { CheckCircle2, Lock, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";
import {
  isUsernameTaken,
  rememberAuthUser,
  type KidSpotAccount,
} from "@/lib/user";

type Mode = "signin" | "register";
type UsernameStatus = "idle" | "checking" | "available" | "taken";

const fieldClass =
  "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-800 outline-none transition-all placeholder:font-normal placeholder:text-stone-400 focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/40";
const labelClass = "block text-xs font-bold text-stone-700";

export function LoginModal({
  context,
  subtitle,
  onClose,
  onSuccess,
}: {
  context?: string;
  subtitle: string;
  onClose: () => void;
  onSuccess: (account: KidSpotAccount) => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [numKids, setNumKids] = useState<number | null>(null);
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (username.length < 3 || /\s/.test(username)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timeoutId = window.setTimeout(() => {
      setUsernameStatus(isUsernameTaken(username) ? "taken" : "available");
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [username]);

  function finish(user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }) {
    onSuccess(rememberAuthUser(user));
  }

  function shown(field: string) {
    return submitted || Boolean(touched[field]);
  }

  function markTouched(field: string) {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function switchMode(next: Mode) {
    setMode(next);
    setSubmitted(false);
    setTouched({});
    setError("");
  }

  const usernameMessage = !username.trim()
    ? "User ID is required."
    : /\s/.test(username)
      ? "User ID cannot contain spaces."
      : username.trim().length < 3
        ? "User ID must be at least 3 characters."
        : usernameStatus === "taken"
          ? "That user ID is already taken."
          : "";
  const fullNameMessage = fullName.trim() ? "" : "Full name is required.";
  const registerEmailMessage = emailMessage(registerEmail);
  const passwordMessage = !registerPassword
    ? "Password is required."
    : registerPassword.length < 6
      ? "Password must be at least 6 characters."
      : "";
  const confirmMessage = !confirmPassword
    ? "Confirm your password."
    : confirmPassword !== registerPassword
      ? "Passwords do not match."
      : "";
  const kidsMessage = numKids === null ? "Choose how many kids are at home." : "";
  const signInEmailMessage = emailMessage(email);
  const signInPasswordMessage = password ? "" : "Password is required.";
  const showConfirm =
    shown("confirm") || (confirmPassword.length > 0 && confirmPassword !== registerPassword);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (signInEmailMessage || signInPasswordMessage) {
      revealFirstError();
      return;
    }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (authError || !data.user) {
      setError(authError?.message || "Could not sign in");
      return;
    }
    finish(data.user);
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (
      usernameMessage ||
      fullNameMessage ||
      registerEmailMessage ||
      passwordMessage ||
      confirmMessage ||
      kidsMessage
    ) {
      revealFirstError();
      return;
    }
    if (usernameStatus === "checking") {
      setError("Still checking that user ID. Try again in a moment.");
      return;
    }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: registerEmail.trim(),
      password: registerPassword,
      options: {
        data: {
          username: username || undefined,
          full_name: fullName.trim(),
          display_name: nickname.trim() || fullName.trim(),
          phone: phone.trim() || undefined,
          neighbourhood: neighbourhood.trim() || undefined,
          num_kids: numKids,
        },
      },
    });
    setBusy(false);
    if (authError || !data.user) {
      setError(authError?.message || "Could not create the account");
      return;
    }
    if (!data.session) {
      setError("Account created. Confirm the email, then sign in.");
      setMode("signin");
      setEmail(registerEmail.trim());
      return;
    }
    finish(data.user);
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    sessionStorage.setItem("kidspot_after_auth", "add");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      sessionStorage.removeItem("kidspot_after_auth");
      setError(authError.message);
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-stone-900/65 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kidspot-login-title"
        className="flex max-h-[92vh] w-full max-w-[440px] flex-col rounded-3xl border border-stone-100 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-stone-100 px-6 pt-5 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff6b6b] text-xl shadow-xs">
                🌿
              </div>
              <div>
                <h2
                  id="kidspot-login-title"
                  className="text-base leading-none font-extrabold text-stone-900"
                >
                  KidSpot
                </h2>
                <p className="mt-0.5 text-xs font-medium text-stone-400">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {context ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-snug font-semibold text-amber-900">{context}</p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 px-6 pt-4">
          {(["signin", "register"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={cn(
                "flex-1 cursor-pointer rounded-xl py-2 text-xs font-extrabold transition-all",
                mode === item
                  ? "bg-[#ff6b6b] text-white shadow-sm"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200",
              )}
            >
              {item === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <button
            type="button"
            onClick={() => void continueWithGoogle()}
            disabled={busy}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white py-3 text-sm font-bold text-stone-800 shadow-xs transition-all hover:bg-stone-50 hover:shadow-md disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-medium text-stone-400">or</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}

          {mode === "signin" ? (
            <form onSubmit={signIn} className="flex flex-col gap-5">
              <label className={labelClass}>
                Email Address
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  aria-invalid={shown("signInEmail") && Boolean(signInEmailMessage)}
                  onBlur={() => markTouched("signInEmail")}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass(shown("signInEmail") && Boolean(signInEmailMessage))}
                />
                {shown("signInEmail") ? <FieldError message={signInEmailMessage} /> : null}
              </label>
              <label className={labelClass}>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  aria-invalid={shown("signInPassword") && Boolean(signInPasswordMessage)}
                  onBlur={() => markTouched("signInPassword")}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass(shown("signInPassword") && Boolean(signInPasswordMessage))}
                />
                {shown("signInPassword") ? <FieldError message={signInPasswordMessage} /> : null}
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer rounded-2xl bg-[#ff6b6b] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#ff6b6b]/25 transition-all hover:bg-[#ff6b6b]/90 disabled:opacity-60"
              >
                Sign In →
              </button>
              <p className="pb-2 text-center text-xs text-stone-400">
                New to KidSpot?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="cursor-pointer font-bold text-[#ff6b6b] hover:underline"
                >
                  Create a free account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={register} className="flex flex-col gap-5 pb-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="kidspot-username">
                  User ID <span className="text-[#ff6b6b]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="kidspot-username"
                    type="text"
                    placeholder="e.g. sarah_rh"
                    value={username}
                    autoComplete="username"
                    aria-invalid={shown("username") && Boolean(usernameMessage)}
                    onBlur={() => markTouched("username")}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (/\s/.test(next)) markTouched("username");
                      setUsername(next);
                    }}
                    className={inputClass(shown("username") && Boolean(usernameMessage), "pr-28")}
                  />
                  <div className="pointer-events-none absolute top-3 right-3">
                    {usernameStatus === "checking" ? (
                      <span className="text-[10px] font-bold text-stone-400">Checking…</span>
                    ) : null}
                    {usernameStatus === "available" ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> Available
                      </span>
                    ) : null}
                    {usernameStatus === "taken" ? (
                      <span className="text-[10px] font-bold text-rose-600">Already taken ✗</span>
                    ) : null}
                  </div>
                </div>
                {shown("username") && usernameMessage ? (
                  <FieldError message={usernameMessage} />
                ) : (
                  <p className="text-[11px] font-medium text-stone-400">
                    Use a short ID with no spaces, like sarah_rh.
                  </p>
                )}
              </div>
              <label className={labelClass}>
                Full Name <span className="text-[#ff6b6b]">*</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  aria-invalid={shown("fullName") && Boolean(fullNameMessage)}
                  onBlur={() => markTouched("fullName")}
                  onChange={(event) => setFullName(event.target.value)}
                  className={inputClass(shown("fullName") && Boolean(fullNameMessage))}
                />
                {shown("fullName") ? <FieldError message={fullNameMessage} /> : null}
              </label>
              <label className={labelClass}>
                Email Address <span className="text-[#ff6b6b]">*</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={registerEmail}
                  aria-invalid={shown("registerEmail") && Boolean(registerEmailMessage)}
                  onBlur={() => markTouched("registerEmail")}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  className={inputClass(shown("registerEmail") && Boolean(registerEmailMessage))}
                />
                {shown("registerEmail") ? <FieldError message={registerEmailMessage} /> : null}
              </label>
              <label className={labelClass}>
                Password <span className="text-[#ff6b6b]">*</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={registerPassword}
                  aria-invalid={shown("password") && Boolean(passwordMessage)}
                  onBlur={() => markTouched("password")}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  className={inputClass(shown("password") && Boolean(passwordMessage))}
                />
                {shown("password") ? <FieldError message={passwordMessage} /> : null}
              </label>
              <label className={labelClass}>
                Confirm Password <span className="text-[#ff6b6b]">*</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  aria-invalid={showConfirm && Boolean(confirmMessage)}
                  onBlur={() => markTouched("confirm")}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass(showConfirm && Boolean(confirmMessage))}
                />
                {showConfirm ? <FieldError message={confirmMessage} /> : null}
              </label>
              <label className={labelClass}>
                Display Name{" "}
                <span className="text-[11px] font-normal text-stone-400">
                  optional — defaults to your name
                </span>
                <input
                  type="text"
                  placeholder={fullName || "Shown on your posts & reviews"}
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className={cn(fieldClass, "mt-1.5")}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={labelClass}>
                  Phone <span className="text-[11px] font-normal text-stone-400">opt.</span>
                  <input
                    type="tel"
                    placeholder="647-xxx-xxxx"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                  />
                </label>
                <label className={labelClass}>
                  Neighbourhood{" "}
                  <span className="text-[11px] font-normal text-stone-400">opt.</span>
                  <input
                    type="text"
                    placeholder="e.g. Oak Ridges"
                    value={neighbourhood}
                    onChange={(event) => setNeighbourhood(event.target.value)}
                    className={cn(fieldClass, "mt-1.5")}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold text-stone-700">
                  Kids at home <span className="text-[#ff6b6b]">*</span>
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumKids(count)}
                      className={cn(
                        "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-extrabold transition-all",
                        numKids === count
                          ? "border-[#ff6b6b] bg-[#ff6b6b] text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-600 hover:border-[#ff6b6b]/60",
                      )}
                    >
                      {count === 5 ? "5+" : count}
                    </button>
                  ))}
                </div>
                {numKids === 0 ? (
                  <p className="mt-1 text-[11px] text-stone-400">
                    No worries — expecting or just curious? Welcome! 👋
                  </p>
                ) : null}
                {shown("kids") ? <FieldError message={kidsMessage} /> : null}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer rounded-2xl bg-[#ff6b6b] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#ff6b6b]/25 transition-all hover:bg-[#ff6b6b]/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create My Account →
              </button>
              <p className="text-center text-xs text-stone-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="cursor-pointer font-bold text-[#ff6b6b] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function revealFirstError() {
  window.setTimeout(() => {
    document.querySelector("[data-field-error]")?.scrollIntoView({ block: "nearest" });
  }, 0);
}

function inputClass(invalid: boolean, extra?: string) {
  return cn(
    fieldClass,
    "mt-1.5",
    extra,
    invalid && "border-rose-300 focus:border-rose-400 focus:ring-rose-200",
  );
}

function emailMessage(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return "";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" data-field-error="" className="mt-1 text-[11px] font-semibold text-rose-600">
      {message}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.251 17.64 11.943 17.64 9.2z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
