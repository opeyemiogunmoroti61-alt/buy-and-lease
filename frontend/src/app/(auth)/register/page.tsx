import RedirectIfAuthenticated from "@/components/RedirectIfAuthenticated";
import SignUpForm from "@/components/SignUpForm";
import Link from "next/link";
import React from "react";

const SignUp = async () => {
  return (
    <RedirectIfAuthenticated>
    <div className="w-full flex mt-30 justify-center">
      <section className="flex flex-col w-[400px]">
        <h1 className="text-3xl w-full text-center font-bold mb-6">Sign Up</h1>
        <SignUpForm />
        <div className="mt-2 flex items-center">
          <h1>Already have an account?</h1>
          <Link className="font-bold ml-2" href="/login">
            Sign In
          </Link>
        </div>
      </section>
    </div>
    </RedirectIfAuthenticated>
  );
};

export default SignUp;
