import { LoginForm } from "@/components/ui/login";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full">

      {/* Left Section - Modern Minimal Design */}
      <div className="relative flex flex-1 items-center justify-center p-10 bg-gray-50">

        {/* Glassmorphism Card */}
        <div className="relative p-10   z-10">
          <img src="/image.jpg" alt="image" className="  max-w-110 w-full" />
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex flex-1 items-center bg-gray-50 justify-center p-6 md:p-10">
        <div className="w-full max-w-sm py-2 bg-white rounded-2xl shadow-lg">
          <LoginForm />
        </div>
      </div>

    </div>
  );
}
