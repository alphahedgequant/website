import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 py-16">
      <p className="eyebrow mb-6">[ AHQ : SIGN IN ]</p>
      <SignIn fallbackRedirectUrl="/screener" signUpUrl="/sign-up" />
    </div>
  );
}
