import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          KZ Serviços
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 text-center">
          Plataforma de serviços sob demanda — transporte, limpeza, manutenção e
          mais.
        </p>
        <Link
          href="/documentacao-da-api"
          className="rounded-full bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Documentação da API
        </Link>
      </main>
    </div>
  );
}
