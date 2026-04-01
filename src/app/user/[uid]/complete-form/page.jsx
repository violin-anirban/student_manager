"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../navbar/navbar";
import { useRouter } from "next/navigation";
import { supabase } from "../../../supabaseConfig";

export default function CompleteForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setDisplayName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "User"
        );
      }
    });
  }, []);

  const handleFormRedirect = () => {
    window.open(
      "https://docs.google.com/forms/d/1_tdk6BvpHvKqWZQhZJ-7D9i6GSC2fngkg3c62vyPYzc/viewform?edit_requested=true",
      "_blank"
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Failed to log out: " + err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-900">
        <div className="relative flex-grow flex items-center justify-center text-center p-6">
          <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-20"></div>

          <div className="relative z-10 w-full max-w-lg p-10 md:p-12 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl border border-yellow-600/30">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Welcome, <span className="text-yellow-600">{displayName}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
              Before booking classes with Anirban, please fill out the registration form and follow the instructions given therein.
            </p>

            <div className="flex flex-col space-y-4">
              <button
                className="w-full transition duration-300 transform hover:scale-[1.02] bg-yellow-600 hover:bg-yellow-700 hover:cursor-pointer px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl"
                onClick={handleFormRedirect}
              >
                Fill Out the Registration Form
              </button>

              <button
                className="w-full transition duration-300 border border-blue-600 text-blue-300 hover:text-white hover:bg-blue-600 hover:cursor-pointer px-8 py-4 rounded-lg font-semibold text-base"
                onClick={handleLogout}
              >
                Log Out Securely
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
