import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
