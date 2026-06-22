import RegisterForm from "@/app/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Inscription</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
