import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Gotion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal operating system.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
