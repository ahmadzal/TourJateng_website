import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid place-content-center  h-screen">
      <header>
        <nav className="space-x-5">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </nav>
      </header>
    </div>
  );
}