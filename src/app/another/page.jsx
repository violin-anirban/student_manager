"use client";

import { useEffect, useState } from "react";
import Navbar from "../navbar/navbar";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseConfig";
import LoadingSpinner from "../loading/loadingSpinner";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const supaUser = session.user;
          setUser(supaUser);

          const { data: existing } = await supabase
            .from("users")
            .select("*")
            .eq("uid", supaUser.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("users").insert({
              uid: supaUser.id,
              email: supaUser.email || "N/A",
              displayName: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || "Organizer User",
              photoURL: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture || "",
              role: "user",
              createdAt: new Date().toISOString(),
            });
          }

          router.push(`/user/${supaUser.id}`);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/another",
      },
    });
  };

  if (loading) return <div className="p-8 text-white"><LoadingSpinner /></div>;

  return (
    <>
      <Navbar />

    <div className="relative min-h-screen flex flex-col items-center justify-center text-center bg-gray-900">

    <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-30"></div>

    <div className="relative z-10 flex flex-col">
      <h1 className="text-6xl font-bold font-palisade bg-transparent text-white p-4 rounded-2xl mb-6">The one stop solution for all your violin learning needs.</h1>

      <button
        className="bg-green-600 m-4 hover:bg-blue-700 hover:cursor-pointer px-6 py-3 rounded text-white font-bold"
        onClick={() => window.location.href = "https://docs.google.com/forms/d/1_tdk6BvpHvKqWZQhZJ-7D9i6GSC2fngkg3c62vyPYzc/viewform?edit_requested=true"}
      >
        For New Students
      </button>
      <button
        className="bg-red-600 m-4 hover:bg-blue-700 hover:cursor-pointer px-6 py-3 rounded text-white font-bold"
        onClick={() => router.push("/take-a-lesson")}
      >
        For Existing Students (Dummy)
      </button>

      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer px-6 py-3 rounded text-white font-bold"
        >
        For Existing Students (Login)
      </button>
    </div>

    </div>

        </>

  );
}
