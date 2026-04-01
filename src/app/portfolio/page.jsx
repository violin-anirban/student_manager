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
  const [checkingForm, setCheckingForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthUser = async (supaUser) => {
      if (!supaUser.email) {
        setLoading(false);
        return;
      }

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
          classFee: 600,
          createdAt: new Date().toISOString(),
        });
      }

      setUser(supaUser);
      setCheckingForm(true);

      try {
        const response = await fetch("/api/checkFormSubmission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: supaUser.email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} ${errorData.details || response.statusText}`);
        }

        const data = await response.json();

        if (data.hasSubmitted) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("uid", supaUser.id)
            .maybeSingle();
          if (userData?.role !== "admin") {
            await supabase
              .from("users")
              .update({ role: "student" })
              .eq("uid", supaUser.id);
          }
          router.push(`/user/${supaUser.id}`);
        } else {
          router.push(`/user/${supaUser.id}/complete-form`);
        }
      } catch (error) {
        setError(error.message);
        router.push(`/user/${supaUser.id}/complete-form`);
      } finally {
        setCheckingForm(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          handleAuthUser(session.user);
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/portfolio",
        },
      });
      if (error) setError(error.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFormRedirect = () => {
    window.location.href = "https://docs.google.com/forms/d/1_tdk6BvpHvKqWZQhZJ-7D9i6GSC2fngkg3c62vyPYzc/viewform?edit_requested=true";
  };

  if (loading || checkingForm) {
    return (
      <div className="p-8 text-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center bg-gray-900">
        <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="relative z-10 flex flex-col">
          <h1 className="text-4xl font-bold font-opensans bg-transparent text-white p-4 rounded-2xl mb-6">
            The one stop solution for all your <br /> violin learning needs!
          </h1>
          {error && (
            <p className="text-red-500 mb-4">Error: {error}</p>
          )}
          <button
            className="bg-green-600 m-4 hover:bg-blue-700 hover:cursor-pointer px-6 py-3 rounded text-white font-bold"
            onClick={handleFormRedirect}
          >
            For New Students
          </button>
          {!user && (
            <button
              onClick={handleLogin}
              className="bg-blue-600 m-4 hover:bg-blue-700 hover:cursor-pointer px-6 py-3 rounded text-white font-bold"
            >
              Login to Continue
            </button>
          )}
        </div>
      </div>
    </>
  );
}
