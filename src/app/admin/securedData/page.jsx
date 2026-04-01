"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabaseConfig";
import { usePasscodeGate, PasscodeGate } from "../usePasscodeGate";

// PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* Helpers */
const formatDate = (ts) => {
  if (!ts) return "\u2014";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
};

/* PDF Table Configuration */
const PDF_TABLE_CONFIG = {
  creditRequests: {
    headers: ["Request Date", "User", "Amount", "Payment Method", "Status"],
    mapRow: (item, userNames) => [
      formatDate(item.createdAt),
      userNames.get(item.targetUserId) || "Unknown",
      item.amount ?? "\u2014",
      item.paymentMethod ?? "\u2014",
      item.status ?? "\u2014",
    ],
  },
  classesRequests: {
    headers: ["Student Name", "Requested Date", "Requested Time", "Class Type", "Status"],
    mapRow: (item, userNames) => [
      userNames.get(item.uid || item.userId) || "Unknown",
      item.date || "\u2014",
      item.time || "\u2014",
      item.classType || item.instrument || "\u2014",
      item.status || "Pending",
    ],
  },
};

const KNOWN_COLLECTIONS = [
  "users",
  "classesRequests",
  "creditRequests",
  "guestlist",
  "notices",
  "upcomingConcerts",
];

export default function DatabaseBrowser() {
  const router = useRouter();
  const passcodeGate = usePasscodeGate();

  const [ready, setReady] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [editingDoc, setEditingDoc] = useState(null);
  const [editJson, setEditJson] = useState("");

  /* Auth */
  useEffect(() => {
    if (!passcodeGate.verified) return;
    setReady(true);
  }, [passcodeGate.verified]);

  /* Fetch docs when collection changes */
  const fetchDocs = async (table) => {
    const target = table || selectedCollection;
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from(target)
        .select("*")
        .order("createdAt", { ascending: false });
      if (err) throw err;
      setDocs(data || []);
      setFilteredDocs(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCollection || !ready) return;
    fetchDocs(selectedCollection);

    // Realtime subscription
    const channel = supabase
      .channel(`browser_${selectedCollection}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: selectedCollection },
        () => fetchDocs(selectedCollection)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedCollection, ready]);

  /* Search */
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredDocs(docs.filter((d) => JSON.stringify(d).toLowerCase().includes(term)));
  }, [searchTerm, docs]);

  /* CRUD */
  const handleDelete = async (id) => {
    if (!confirm(`Delete document ${id}?`)) return;
    const idCol = selectedCollection === "users" ? "uid" : "id";
    await supabase.from(selectedCollection).delete().eq(idCol, id);
    fetchDocs();
  };

  const startEdit = (item) => {
    setEditingDoc(item);
    const { id, ...rest } = item;
    setEditJson(JSON.stringify(rest, null, 2));
  };

  const saveEdit = async () => {
    if (!editingDoc || !selectedCollection) return;
    try {
      const updatedData = JSON.parse(editJson);
      const idCol = selectedCollection === "users" ? "uid" : "id";
      const idVal = selectedCollection === "users" ? editingDoc.uid : editingDoc.id;
      await supabase.from(selectedCollection).update(updatedData).eq(idCol, idVal);
      setEditingDoc(null);
      setEditJson("");
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const deleteAllDocuments = async () => {
    if (!selectedCollection || !["classesRequests", "creditRequests"].includes(selectedCollection)) return;
    const count = docs.length;
    if (!confirm(`This will PERMANENTLY DELETE ALL ${count} documents.`)) return;
    const typed = prompt(`Type exactly: DELETE ${count} to confirm`);
    if (typed !== `DELETE ${count}`) {
      alert("Cancelled.");
      return;
    }
    try {
      const ids = docs.map((d) => d.id);
      await supabase.from(selectedCollection).delete().in("id", ids);
      alert(`Deleted ${count} documents.`);
      fetchDocs();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  /* PDF Export */
  const generateSummaryPDF = async () => {
    if (!selectedCollection || docs.length === 0) {
      alert("No data to export");
      return;
    }

    const userNames = new Map();
    const uids = new Set();
    docs.forEach((item) => {
      if (item.uid) uids.add(item.uid);
      if (item.userId) uids.add(item.userId);
      if (item.targetUserId) uids.add(item.targetUserId);
    });

    await Promise.all(
      [...uids].map(async (uid) => {
        try {
          const { data } = await supabase
            .from("users")
            .select("displayName")
            .eq("uid", uid)
            .maybeSingle();
          if (data) userNames.set(uid, data.displayName || "Unknown");
        } catch (e) {
          console.error("Failed to fetch user:", uid, e);
        }
      })
    );

    const pdfDoc = new jsPDF();
    pdfDoc.setFontSize(18);
    pdfDoc.setTextColor(66, 139, 202);
    pdfDoc.text(`Collection: ${selectedCollection}`, 14, 20);

    pdfDoc.setFontSize(11);
    pdfDoc.setTextColor(0);
    pdfDoc.text(`Total documents: ${docs.length}`, 14, 30);
    pdfDoc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

    const tableConfig = PDF_TABLE_CONFIG[selectedCollection];
    let head = [];
    let body = [];

    if (tableConfig) {
      head = [tableConfig.headers];
      body = docs.map((item) => tableConfig.mapRow(item, userNames));
    } else {
      const keys = Array.from(new Set(docs.flatMap((d) => Object.keys(d)))).filter((k) => k !== "id");
      head = [keys.map((k) => k.toUpperCase())];
      body = docs.map((item) =>
        keys.map((k) => {
          const v = item[k];
          return v === null || v === undefined ? "\u2014" : String(v).slice(0, 80);
        })
      );
    }

    autoTable(pdfDoc, {
      startY: 45,
      head,
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    pdfDoc.save(`${selectedCollection}_summary_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!passcodeGate.verified || passcodeGate.roleStatus !== "admin") {
    return <PasscodeGate gate={passcodeGate} />;
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <h1 className="text-3xl text-center font-bold text-amber-400 mb-6">Database Browser</h1>
      <h2 className="text-6xl text-center p-4 font-semibold text-red-800 mb-4">Use Carefully</h2>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {KNOWN_COLLECTIONS.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCollection(c)}
            className={`px-4 py-2 rounded ${selectedCollection === c ? "bg-amber-600 text-black" : "bg-gray-800"}`}
          >
            {c}
          </button>
        ))}

        {selectedCollection && (
          <button onClick={generateSummaryPDF} className="bg-blue-600 px-4 py-2 rounded ml-auto">
            Export PDF
          </button>
        )}
      </div>

      {["classesRequests", "creditRequests"].includes(selectedCollection) && docs.length > 0 && (
        <div className="mb-6 flex justify-between p-4 border border-red-900/50 bg-red-950/20 rounded-lg">
          <button onClick={deleteAllDocuments} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded">
            DELETE ALL {docs.length} DOCUMENTS
          </button>
          <span className="text-red-400 text-xl italic">*This action cannot be undone.</span>
        </div>
      )}

      <input
        className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-4">
        {filteredDocs.map((d) => (
          <div key={d.id || d.uid} className="border border-gray-800 p-4 rounded bg-gray-900/40">
            <div className="flex justify-between items-start mb-2">
              <span className="text-blue-400 font-mono text-xs">{d.id || d.uid}</span>
              <div className="flex gap-4">
                <button onClick={() => startEdit(d)} className="text-amber-400 hover:underline text-sm font-bold">
                  Edit
                </button>
                <button onClick={() => handleDelete(d.id || d.uid)} className="text-red-400 hover:underline text-sm">
                  Delete
                </button>
              </div>
            </div>
            <pre className="text-[10px] text-gray-400 overflow-auto max-h-40">
              {JSON.stringify(d, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-amber-400">Edit Document</h3>
                <button onClick={() => setEditingDoc(null)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-96 p-4 bg-gray-800 text-gray-200 font-mono text-sm rounded border border-gray-700 focus:outline-none focus:border-amber-500"
                spellCheck={false}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditingDoc(null)} className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button onClick={saveEdit} className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 font-bold">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
