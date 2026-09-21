import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SignupForm from "@/components/SignupForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-brand-gradient">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-2xl font-bold">Crée ton compte</h1>
          <p className="text-white/50 text-sm mt-1">Juste l&apos;essentiel, promis.</p>
        </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
