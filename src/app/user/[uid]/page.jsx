"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../supabaseConfig";
import Navbar from "../../navbar/navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingSpinner from "../../loading/loadingSpinner";

export default function UserPage() {
  const { uid } = useParams();
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  const [credit, setCredit] = useState(0);
  const [latestClassSchedule, setLatestClassSchedule] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  const [allClassRequests, setAllClassRequests] = useState([]);
  const [allCreditRequests, setAllCreditRequests] = useState([]);
  const [creditSearch, setCreditSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");

  /* ---------------- FETCH USER + NOTICE ---------------- */
  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("*")
          .eq("uid", uid)
          .maybeSingle();

        if (userErr || !userRow) {
          setError("User profile not found.");
          return;
        }

        setUserData(userRow);
        setCredit(userRow.credits || 0);

        if (userRow.role === "admin") {
          router.push("/admin");
          return;
        }

        const { data: noticeRows } = await supabase
          .from("notices")
          .select("*")
          .order("createdAt", { ascending: false })
          .limit(1);

        if (noticeRows?.length > 0) setNotice(noticeRows[0]);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, router]);

  /* ---------------- LIVE LATEST CLASS (REALTIME) ---------------- */
  useEffect(() => {
    if (!uid) return;

    const fetchLatestClass = async () => {
      const { data: allData } = await supabase
        .from("classesRequests")
        .select("*")
        .eq("uid", uid)
        .order("createdAtClient", { ascending: false });
      setAllClassRequests(allData || []);
      setLatestClassSchedule(allData?.[0] || null);
    };

    fetchLatestClass();

    const channel = supabase
      .channel(`classes_${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classesRequests",
          filter: `uid=eq.${uid}`,
        },
        () => fetchLatestClass()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [uid]);

  /* ---------------- LAST PAYMENT ---------------- */
  useEffect(() => {
    if (!uid) return;

    supabase
      .from("creditRequests")
      .select("*")
      .eq("targetUserId", uid)
      .order("createdAt", { ascending: false })
      .then(({ data }) => {
        setAllCreditRequests(data || []);
        if (data?.[0]) setLastPayment(data[0]);
      });
  }, [uid]);

  /* ---------------- ACTIONS ---------------- */
  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select date and time.");
      return;
    }

    await supabase.from("classesRequests").insert({
      uid,
      date: selectedDate.toLocaleDateString("en-CA"),
      time: selectedTime,
      status: "pending",
      createdAtClient: new Date().toISOString(),
    });

    alert("Class schedule request sent!");
    setShowSchedulePopup(false);
    setSelectedDate(null);
    setSelectedTime("");
  };

  const handleBuyCredit = () => router.push(`/user/${uid}/buy-credit`);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0905]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0905]">
        <div className="bg-[#1a1209] border border-[#b8922a]/25 px-6 py-4 rounded-sm text-[#f5efe4]/70">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-[#0c0905] text-[#f5efe4] pt-24 sm:pt-28 px-4 sm:px-6 pb-8">
        <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-20">
          <div className="absolute inset-0 bg-[#0c0905]/80 backdrop-blur-sm" />
        </div>

        <section className="relative z-10 max-w-4xl lg:max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-up">
          <div className="text-center">
            <p className="text-[10px] tracking-[0.24em] uppercase text-[#b8922a] font-medium mb-3 flex items-center justify-center gap-2.5">
              <span className="w-5 h-px bg-[#b8922a] inline-block"></span>Dashboard
            </p>
            <h1 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl md:text-5xl font-light italic text-[#f5efe4]">
              Welcome, {userData?.displayName || "User"}
            </h1>
            <p className="text-[#f5efe4]/50 mt-2 text-sm sm:text-base font-[family-name:var(--font-cormorant)] italic">
              Manage your classes, notices & payments
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            {[
              ["Schedule a Class", () => setShowSchedulePopup(true)],
              ["Pay for Class(es)", handleBuyCredit],
              ["Logout", handleLogout],
            ].map(([text, action]) => (
              <button
                key={text}
                onClick={action}
                className="px-6 py-2.5 border border-[#b8922a] text-[#b8922a] text-[10px] sm:text-xs font-medium tracking-[0.15em] uppercase
                hover:bg-[#b8922a] hover:text-[#f5efe4] cursor-pointer transition-all duration-300 text-sm sm:text-base"
              >
                {text}
              </button>
            ))}
          </div>

          <Card title="Latest Notice">
            {notice?.text || "No notices available."}
          </Card>

          <div className={`p-4 sm:p-5 rounded-sm text-center border shadow-lg text-sm sm:text-base
            ${credit >= 0
              ? "bg-[#1a1209] border-[#b8922a]/25 text-[#b8922a]"
              : "bg-[#1a1209] border-[#b8922a]/40 text-[#f5efe4]/70"}`}>
            {credit >= 0
              ? `You have ${credit} classes left`
              : `Payment due for ${Math.abs(credit)} classes`}
          </div>

          <Card title="Latest Class Schedule">
            {latestClassSchedule ? (
              <>
                <p>Status: {latestClassSchedule.status}</p>
                <p>Date: {latestClassSchedule.date}</p>
                <p>Time: {latestClassSchedule.time}</p>
              </>
            ) : (
              "No class scheduled yet."
            )}
          </Card>

          {lastPayment && (
            <Card title="Last Payment Summary">
              <p>Classes: {lastPayment.amount}</p>
              <p>Status: {lastPayment.status}</p>
              <p>Method: {lastPayment.paymentMethod}</p>
            </Card>
          )}

          {/* History: Side by side on lg, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Request History */}
            <Card title="Class Request History">
              {allClassRequests.length === 0 ? (
                <p>No class requests yet.</p>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search by date, time, status..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#0c0905] text-[#f5efe4] border border-[#b8922a]/20 focus:outline-none focus:ring-1 focus:ring-[#b8922a]/50 text-sm placeholder-[#f5efe4]/30"
                  />
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                    {allClassRequests
                      .filter((r) => {
                        if (!classSearch) return true;
                        const q = classSearch.toLowerCase();
                        return (
                          (r.date ?? "").toLowerCase().includes(q) ||
                          (r.time ?? "").toLowerCase().includes(q) ||
                          (r.status ?? "").toLowerCase().includes(q) ||
                          (r.createdAtClient ? new Date(r.createdAtClient).toLocaleString().toLowerCase().includes(q) : false)
                        );
                      })
                      .map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#0c0905] border border-[#b8922a]/10 p-3 rounded-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <div>
                            <p className="text-[#f5efe4] text-sm font-medium">
                              {r.date} at {r.time}
                            </p>
                            <p className="text-xs text-[#f5efe4]/30">
                              Submitted: {r.createdAtClient ? new Date(r.createdAtClient).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium tracking-wider uppercase px-2 py-1 rounded-sm w-fit ${
                              r.status === "approved"
                                ? "bg-green-900/40 text-green-400 border border-green-700/30"
                                : r.status === "declined"
                                ? "bg-red-900/40 text-red-400 border border-red-700/30"
                                : "bg-yellow-900/40 text-yellow-400 border border-yellow-700/30"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Credit Request History */}
            <Card title="Credit Request History">
              {allCreditRequests.length === 0 ? (
                <p>No credit requests yet.</p>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search by status, method, txn number..."
                    value={creditSearch}
                    onChange={(e) => setCreditSearch(e.target.value)}
                    className="w-full p-2.5 rounded-sm bg-[#0c0905] text-[#f5efe4] border border-[#b8922a]/20 focus:outline-none focus:ring-1 focus:ring-[#b8922a]/50 text-sm placeholder-[#f5efe4]/30"
                  />
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                    {allCreditRequests
                      .filter((r) => {
                        if (!creditSearch) return true;
                        const q = creditSearch.toLowerCase();
                        return (
                          (r.status ?? "").toLowerCase().includes(q) ||
                          (r.paymentMethod ?? "").toLowerCase().includes(q) ||
                          (r.proof ?? "").toLowerCase().includes(q) ||
                          (r.message ?? "").toLowerCase().includes(q) ||
                          String(r.amount).includes(q) ||
                          (r.createdAt ? new Date(r.createdAt).toLocaleString().toLowerCase().includes(q) : false)
                        );
                      })
                      .map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#0c0905] border border-[#b8922a]/10 p-3 rounded-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <div>
                            <p className="text-[#f5efe4] text-sm font-medium">
                              {r.amount} {r.amount == 1 ? "class" : "classes"}
                            </p>
                            <p className="text-xs text-[#f5efe4]/40">
                              Method: {r.paymentMethod} | Txn: {r.proof}
                            </p>
                            {r.message && (
                              <p className="text-xs text-[#f5efe4]/30">Message: {r.message}</p>
                            )}
                            <p className="text-xs text-[#f5efe4]/30">
                              Submitted: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium tracking-wider uppercase px-2 py-1 rounded-sm w-fit ${
                              r.status === "approved"
                                ? "bg-green-900/40 text-green-400 border border-green-700/30"
                                : r.status === "declined"
                                ? "bg-red-900/40 text-red-400 border border-red-700/30"
                                : "bg-yellow-900/40 text-yellow-400 border border-yellow-700/30"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>

        {showSchedulePopup && (
          <div className="fixed inset-0 z-[9999] bg-[#0c0905]/90 flex items-center justify-center px-4">
            <div className="bg-[#1a1209] border border-[#b8922a]/20 p-6 sm:p-8 rounded-sm max-w-md w-full shadow-2xl">
              <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-light italic mb-4 sm:mb-6 text-[#f5efe4]">
                Schedule a Class (IST)
              </h2>

              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                className="w-full p-3 rounded-sm bg-[#0c0905] border border-[#b8922a]/20 text-[#f5efe4] mb-4"
                placeholderText="Select date"
              />

              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 rounded-sm bg-[#0c0905] border border-[#b8922a]/20 text-[#f5efe4] mb-6"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSchedule}
                  className="px-5 py-2 bg-[#b8922a] text-[#0c0905] font-medium rounded-sm hover:bg-[#d4aa4a] transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowSchedulePopup(false)}
                  className="px-5 py-2 border border-[#f5efe4]/20 text-[#f5efe4]/60 rounded-sm hover:border-[#f5efe4]/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* -------- CARD -------- */
function Card({ title, children }) {
  return (
    <div className="bg-[#1a1209] border border-[#b8922a]/15 rounded-sm p-4 sm:p-6">
      <h2 className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-light italic text-[#b8922a] mb-2 sm:mb-3">
        {title}
      </h2>
      <div className="text-[#f5efe4]/60 space-y-1 text-sm sm:text-base">{children}</div>
    </div>
  );
}
