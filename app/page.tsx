import { LoginForm } from "@/components/ui/login";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full">

      {/* Left Section - Modern Minimal Design */}
      <div className="relative flex flex-1 items-center justify-center p-10 bg-gray-100">

        {/* Glassmorphism Card */}
        <div className="relative bg-white/30 p-10 rounded-2xl shadow-xl border border-white/40 z-10">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-black">Welcome Back</h1>
          </div>
          <p className="text-black/70 text-lg max-w-sm">
             Sign in to continue.
          </p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex flex-1 items-center bg-gray-100 justify-center p-6 md:p-10">
        <div className="w-full max-w-sm py-2 bg-white rounded-2xl shadow-lg">
          <LoginForm />
        </div>
      </div>

    </div>
  );
}
