import LoginForm from "@/app/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Connexion</h1>
        <LoginForm />
      </div>
    </div>
  );
}
