import { LoginForm } from "@/components/ui/login";
import { MotionDiv } from "@/components/motion-div";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center from-indigo-500 via-purple-500 to-pink-500 p-6 md:p-10">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl backdrop-blur-xl bg-white/10 shadow-2xl border border-white/20 p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            Welcome Back
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Login to continue your journey 🚀
          </p>
        </div>

        <div className="space-y-4">
          <LoginForm />
        </div>

        <div className="text-center mt-5">
          <p className="text-white/70 text-xs">
            New here?{" "}
            <a
              href="/signup"
              className="text-white font-medium underline hover:text-white/90 transition"
            >
              Create an account
            </a>
          </p>
        </div>
      </MotionDiv>
    </div>
  );
}
