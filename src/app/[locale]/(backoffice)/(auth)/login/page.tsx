import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">Connexion</h1>
        <LoginForm />
      </div>
    </div>
  );
}
