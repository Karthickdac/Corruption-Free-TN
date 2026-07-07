import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
