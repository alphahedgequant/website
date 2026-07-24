import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 py-16">
      <p className="eyebrow mb-6">[ AHQ : CREATE ACCOUNT ]</p>
      <SignUp fallbackRedirectUrl="/screener" signInUrl="/sign-in" />
    </div>
  );
}
