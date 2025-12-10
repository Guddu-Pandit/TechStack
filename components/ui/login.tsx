"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { createClient } from "@/utils/supabase/client";
import { UserRound } from 'lucide-react';


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className={cn("flex flex-col gap-6  ", className)} {...props}>
      <Card className="outline-none border-none shadow-none">
         <UserRound className="text-center mx-auto text-blue-500 w-26 h-26"/>
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Welcome
          </CardTitle>
          <p className="text-center text-black/70 text-lg max-w-sm mx-auto mt-4">
            Login in to continue.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            <FieldGroup>
              <Field>
                <Button
                  className="w-full"
                  onClick={handleGoogleLogin}
                  type="button"
                >
                  Login with Google
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
