import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="p-10 shadow-lg rounded-lg bg-white text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">To-Do App</h1>
        <p className="text-gray-500 mb-6">Please login first to continue</p>
        <Link
          href="/login"
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
