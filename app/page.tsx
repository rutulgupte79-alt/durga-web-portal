"use client";
import { useEffect, useState } from "react";

export default function QCDashboard() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  
  const initialPartState = { 
    part_number: "", part_name: "", quantity: 1, 
    sop: "None", ral_series: "", paint_make: "", 
    dft_requirement: "", blasting_requirement: "", supply_scope: "" 
  };
  const [parts, setParts] = useState([initialPartState]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/inward`);
      if (res.ok) {
        const data = await res.json();
        const activeJobs = data.filter((job: any) => job.status !== 'VOIDED');
        setJobs(activeJobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // UPDATED: Check status, and fetch existing parts if they exist
  const openModal = async (job: any) => {
    setSelectedJob(job);
    setIsLoadingParts(true);
    setIsModalOpen(true);

    if (job.status === "QC_ADVICE_ISSUED") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/inward/${job.job_id}/parts`);
        if (res.ok) {
          const existingParts = await res.json();
          if (existingParts.length > 0) {
            setParts(existingParts);
            setIsLoadingParts(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch existing parts", error);
      }
    }
    
    // Fallback for new entry or if fetch fails
    setParts([{ ...initialPartState }]);
    setIsLoadingParts(false);
  };

  const addPartRow = () => setParts([...parts, { ...initialPartState }]);

  const updatePart = (index: number, field: string, value: string | number) => {
    const newParts = [...parts];
    (newParts[index] as any)[field] = value;
    setParts(newParts);
  };

  const removePartRow = (indexToRemove: number) => {
    if (parts.length === 1) return; // keep at least one row
    setParts(parts.filter((_, index) => index !== indexToRemove));
  };

  const submitParts = async () => {
    try {
      // 1. Explicitly hardcode the URL
      const targetUrl = `http://192.168.1.8:8080/jobs/inward/${encodeURIComponent(selectedJob.job_id)}/parts`;
      console.log("Attempting to send data to:", targetUrl);
      
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parts)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchJobs(); 
      } else {
        const errorData = await res.text();
        alert(`Server rejected the data. Error: ${errorData}`);
      }
    } catch (error) {
      console.error("Fetch crashed:", error);
      alert("Network Error: The browser blocked the request or the Python server at 192.168.1.8:8080 is offline.");
    }
  };
  
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QC Work Advice</h1>
            <p className="text-gray-500 mt-2">Manage material technical specifications</p>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading records...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4 font-semibold">Job ID</th>
                  <th className="p-4 font-semibold">Client</th>
                  <th className="p-4 font-semibold">Material (Total)</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job: any) => (
                  <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-blue-700">{job.job_id}</td>
                    <td className="p-4">
                      <div className="text-gray-900">{job.client_name}</div>
                      <div className="text-xs text-gray-500">Challan: {job.dc_number}</div>
                    </td>
                    <td className="p-4 text-gray-700">{job.gross_weight} {job.routing_unit}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {job.status === 'PENDING' ? 'PENDING ENTRY' : 'ADVICE ISSUED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {job.status === 'PENDING' ? (
                        <button onClick={() => openModal(job)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors">
                          Enter Parts
                        </button>
                      ) : (
                        <button onClick={() => openModal(job)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-medium text-sm transition-colors">
                          View / Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                QC Work Advice: <span className="text-blue-600">{selectedJob?.job_id}</span>
              </h2>
              
              {isLoadingParts ? (
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-500 font-medium">Loading saved parts...</p>
                </div>
              ) : (
                <div className="overflow-y-auto pr-2 flex-1 min-h-[400px]">
                  {parts.map((part, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-5 border-2 border-gray-100 rounded-lg bg-gray-50 relative group">
                      
                      {/* Row indicator & Delete button */}
                      <div className="absolute -left-3 -top-3 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      {parts.length > 1 && (
                        <button onClick={() => removePartRow(index)} className="absolute -right-2 -top-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      )}

                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Part No.</label>
                        <input className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.part_number || ""} onChange={e => updatePart(index, 'part_number', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Part Name</label>
                        <input className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.part_name || ""} onChange={e => updatePart(index, 'part_name', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Qty</label>
                        <input type="number" className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.quantity || 0} onChange={e => updatePart(index, 'quantity', parseInt(e.target.value) || 0)} />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">SOP</label>
                        <select className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={part.sop || "None"} onChange={e => updatePart(index, 'sop', e.target.value)}>
                          <option value="None">None</option>
                          <option value="Blasting">Blasting</option>
                          <option value="Liquid Spray Painting">Liquid Spray Painting</option>
                          <option value="Powder Coating">Powder Coating</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">RAL Series</label>
                        <input className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.ral_series || ""} onChange={e => updatePart(index, 'ral_series', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Make of Paint/Powder</label>
                        <input className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.paint_make || ""} onChange={e => updatePart(index, 'paint_make', e.target.value)} />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">DFT Requirement</label>
                        <input placeholder="e.g. 50-100" className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.dft_requirement || ""} onChange={e => updatePart(index, 'dft_requirement', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Blasting Requirement</label>
                        <input placeholder="e.g. SA 2.5" className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.blasting_requirement || ""} onChange={e => updatePart(index, 'blasting_requirement', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-bold mb-1 uppercase tracking-wide">Supply Scope</label>
                        <input placeholder="e.g. DT" className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.supply_scope || ""} onChange={e => updatePart(index, 'supply_scope', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-6 border-t pt-4 bg-white">
                <button onClick={addPartRow} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-5 py-2 rounded-md font-semibold transition">
                  + Add Another Part
                </button>
                <div className="space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-2 rounded-md font-semibold transition">
                    Cancel
                  </button>
                  <button onClick={submitParts} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-bold shadow-md transition">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}