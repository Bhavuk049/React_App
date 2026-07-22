import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function LoginPage() {
  const { requestOtp, verifyOtp, adminLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await requestOtp(email);
      if (data.status === "password_required") {
        setStep("password");
      } else {
        setDevCode(data.devCode ?? "");
        setStep("otp");
      }
    } catch (err) {
      setError(err.data?.error ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await verifyOtp(email, code);
      navigate(data.user.firstName ? "/" : "/account");
    } catch (err) {
      setError(err.data?.error ?? "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.data?.error ?? "Invalid password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevAdminLogin() {
    setError("");
    setSubmitting(true);
    try {
      await adminLogin("admin@uniqpick.com", "Admin@12345");
      navigate("/admin");
    } catch (err) {
      setError(err.data?.error ?? "Dev admin login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevCustomerLogin() {
    setError("");
    setSubmitting(true);
    try {
      await requestOtp("manu@yopmail.com");
      const data = await verifyOtp("manu@yopmail.com", "123456");
      navigate(data.user.firstName ? "/" : "/account");
    } catch (err) {
      setError(err.data?.error ?? "Dev customer login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      const data = await requestOtp(email);
      setDevCode(data.devCode ?? "");
    } catch (err) {
      setError(err.data?.error ?? "Could not resend the code.");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Log in or sign up</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {step === "email" && "Enter your email — we'll send you a verification code."}
        {step === "otp" && (
          <>
            Enter the 6-digit code sent to <span className="font-medium text-neutral-900">{email}</span>.
          </>
        )}
        {step === "password" && "This is an admin account — enter its password to continue."}
      </p>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {submitting ? "Sending code..." : "Send code"}
          </button>

          <p className="text-center text-xs text-neutral-500">
            By continuing, you agree to our{" "}
            <Link to="/terms-of-service" className="underline hover:text-rose-600">
              Terms of service
            </Link>
          </p>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDevAdminLogin}
              disabled={submitting}
              className="w-full rounded-full border border-dashed border-amber-400 bg-amber-50 px-6 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              Dev: log in as admin
            </button>
          )}

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDevCustomerLogin}
              disabled={submitting}
              className="w-full rounded-full border border-dashed border-amber-400 bg-amber-50 px-6 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              Dev: log in as manu@yopmail.com
            </button>
          )}
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm tracking-widest focus:border-neutral-500 focus:outline-none"
            />
          </div>

          {devCode && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Dev mode (no email configured): your code is <span className="font-semibold">{devCode}</span>
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>

          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setStep("email")} className="text-neutral-500 hover:text-neutral-900">
              Change email
            </button>
            <button type="button" onClick={handleResend} className="font-medium text-neutral-900 underline">
              Resend code
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      )}
    </div>
  );
}
