import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">Inscription</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
