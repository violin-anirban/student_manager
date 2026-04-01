'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabaseConfig";
import LoadingSpinner from "../../loading/loadingSpinner";
import { usePasscodeGate, PasscodeGate } from "../usePasscodeGate";

const formatDate = (date) => {
  try {
    if (!date) return "\u2014";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "Invalid" : d.toLocaleDateString();
  } catch {
    return "Invalid";
  }
};

export default function UsersDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const passcodeGate = usePasscodeGate();
  const [errors, setErrors] = useState([]);
  const [users, setUsers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [editNotice, setEditNotice] = useState(null);
  const [editConcert, setEditConcert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    sessionStorage.removeItem("admin_passcode_verified");
    await supabase.auth.signOut();
    router.push("/");
  };

  const updateNotice = async () => {
    if (!editNotice) return;
    await supabase
      .from("notices")
      .update({ text: editNotice.text, updatedAt: new Date().toISOString() })
      .eq("id", editNotice.id);
    setEditNotice(null);
    fetchNoticesAndConcerts();
  };

  const deleteNotice = async (id) => {
    await supabase.from("notices").delete().eq("id", id);
    fetchNoticesAndConcerts();
  };

  const updateConcert = async () => {
    if (!editConcert) return;
    const { id, venue, date, time, location } = editConcert;
    await supabase
      .from("upcomingConcerts")
      .update({ venue, date, time, location, updatedAt: new Date().toISOString() })
      .eq("id", id);
    setEditConcert(null);
    fetchNoticesAndConcerts();
  };

  const deleteConcert = async (id) => {
    await supabase.from("upcomingConcerts").delete().eq("id", id);
    fetchNoticesAndConcerts();
  };

  const fetchNoticesAndConcerts = async () => {
    const { data: noticeRows } = await supabase
      .from("notices")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(10);
    setNotices((noticeRows || []).map(d => ({ ...d, createdAt: formatDate(d.createdAt) })));

    const { data: concertRows } = await supabase
      .from("upcomingConcerts")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(10);
    setConcerts((concertRows || []).map(d => ({ ...d, createdAt: formatDate(d.createdAt) })));
  };

  useEffect(() => {
    if (!passcodeGate.verified) return;
    const load = async () => {
      const { data: usersRows } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student");

      const raw = (usersRows || []).map(d => ({ ...d, id: d.uid }));

      const withLast = await Promise.all(raw.map(async (u) => {
        const { data: classRows } = await supabase
          .from("classesRequests")
          .select("*")
          .eq("uid", u.id)
          .eq("status", "approved")
          .order("createdAt", { ascending: false })
          .limit(1);

        const last = classRows?.[0];
        return {
          ...u,
          lastClass: last
            ? { date: formatDate(last.date), time: last.time || "\u2014", rawDate: last.date }
            : null
        };
      }));

      withLast.sort((a, b) => {
        if (!a.lastClass) return 1;
        if (!b.lastClass) return -1;
        const da = new Date(a.lastClass.rawDate);
        const dbVal = new Date(b.lastClass.rawDate);
        return dbVal.getTime() - da.getTime();
      });

      setUsers(withLast);
      await fetchNoticesAndConcerts();
      setLoading(false);
    };
    load();
  }, [passcodeGate.verified]);

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!passcodeGate.verified || passcodeGate.roleStatus !== "admin") {
    return <PasscodeGate gate={passcodeGate} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-4 md:px-8">
        <style jsx>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          .fade { animation: fadeIn 0.8s forwards; }
          .pulse { animation: pulse 3s infinite; }
          @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.02); } }
        `}</style>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-pink-500 fade">
            Student Data & Content
          </h1>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-900/80 rounded-xl text-red-200">
              {errors.map((e, i) => <p key={i}>Warning: {e}</p>)}
            </div>
          )}

          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-3 mb-6 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {/* Students */}
          <section className="mb-12">
            <h2 className="text-3xl font-serif mb-4 text-amber-400">Students</h2>
            {filtered.length === 0 ? (
              <p className="text-gray-300 italic">No students found.</p>
            ) : (
              <div className="space-y-4">
                {filtered.map((u, i) => (
                  <div
                    key={u.id}
                    className="bg-gray-800/90 backdrop-blur p-5 rounded-xl fade pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <p className="font-bold">{u.displayName || "N/A"}</p>
                    <p className="text-sm text-gray-300">Email: {u.email}</p>
                    <p className="text-sm text-gray-300">Credits: {u.credits ?? 0}</p>
                    <p className="text-sm text-gray-300">
                      Last Class: {u.lastClass ? `${u.lastClass.date} @ ${u.lastClass.time}` : "None"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="text-center space-x-4">
            <button
              onClick={() => router.push("/admin")}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-800"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
