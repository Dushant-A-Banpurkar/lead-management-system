import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, CheckCircle2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "../api";
import { useAuth } from "../auth/AuthProvider";
import type { User } from "../types";

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Password is required") });
const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type AuthResponse = { token: string; user: User };

export default function AuthPage() {
  const [registering, setRegistering] = useState(false);
  return (
    <main className="flex min-h-screen bg-white">
      <section className="hidden w-[48%] flex-col justify-between overflow-hidden bg-[#171b3a] p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500"><BarChart3 size={22} /></span><span className="text-lg font-bold">leadflow</span></div>
        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-indigo-300">The clearer path to growth</p>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight">Turn every conversation into momentum.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">One focused workspace to follow your leads, stay on top of next steps, and see what’s moving your business forward.</p>
          <div className="mt-10 space-y-4 text-sm text-slate-200">
            {["One view of every opportunity", "Follow-ups that never slip through", "A pipeline you can act on"].map((item) => <p key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-300" />{item}</p>)}
          </div>
        </div>
        <p className="text-xs text-slate-400">A thoughtful home for your sales pipeline.</p>
        <div className="pointer-events-none absolute bottom-24 left-[28%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </section>
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><BarChart3 size={22} /></span><span className="text-lg font-bold text-slate-900">leadflow</span></div>
          {registering
            ? <RegisterForm onBack={() => setRegistering(false)} />
            : <LoginForm onRegister={() => setRegistering(true)} />}
        </div>
      </section>
    </main>
  );
}

function LoginForm({ onRegister }: { onRegister: () => void }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const submit = async (values: LoginValues) => {
    setServerError("");
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", values);
      signIn(data.user, data.token);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      setServerError(apiErrorMessage(error, "Unable to sign in. Please try again."));
    }
  };

  return (
    <>
      <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
      <p className="mt-2 text-sm text-slate-500">Pick up right where your pipeline left off.</p>
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-slate-700">Email address<input type="email" autoComplete="email" className="input mt-2" placeholder="you@company.com" {...register("email")} />{errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>}</label>
        <label className="block text-sm font-medium text-slate-700">Password<input type="password" autoComplete="current-password" className="input mt-2" placeholder="Your password" {...register("password")} />{errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>}</label>
        {serverError && <ErrorNotice message={serverError} />}
        <button className="button-primary w-full justify-center py-3" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}<ChevronRight size={17} /></button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">New to leadflow? <button className="font-semibold text-indigo-600 hover:text-indigo-700" onClick={onRegister}>Create an account</button></p>
    </>
  );
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const submit = async (values: RegisterValues) => {
    setServerError("");
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", values);
      signIn(data.user, data.token);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      setServerError(apiErrorMessage(error, "Unable to create your account. Please try again."));
    }
  };

  return (
    <>
      <p className="text-sm font-semibold text-indigo-600">GET STARTED</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Create your account</h2>
      <p className="mt-2 text-sm text-slate-500">Build a better rhythm for following up.</p>
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-slate-700">Your name<input autoComplete="name" className="input mt-2" placeholder="Alex Morgan" {...register("name")} />{errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name.message}</span>}</label>
        <label className="block text-sm font-medium text-slate-700">Email address<input type="email" autoComplete="email" className="input mt-2" placeholder="you@company.com" {...register("email")} />{errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>}</label>
        <label className="block text-sm font-medium text-slate-700">Password<input type="password" autoComplete="new-password" className="input mt-2" placeholder="At least 8 characters" {...register("password")} />{errors.password && <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>}</label>
        {serverError && <ErrorNotice message={serverError} />}
        <button className="button-primary w-full justify-center py-3" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}<ChevronRight size={17} /></button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <button className="font-semibold text-indigo-600 hover:text-indigo-700" onClick={onBack}>Sign in</button></p>
    </>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>;
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") return data.message;
    }
  }
  return fallback;
}
