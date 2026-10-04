"use client";
import { useEffect, useState } from "react";

export default function QCDashboard() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal and Parts State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [parts, setParts] = useState([
    { part_number: "", part_description: "", quantity: 1, sop_reference: "", blasting_standard: "", paint_make: "", dft_requirement: "" }
  ]);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  async function fetchPendingJobs() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/inward/recent`);
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

  const openModal = (job: any) => {
    setSelectedJob(job);
    setParts([{ part_number: "", part_description: "", quantity: 1, sop_reference: "", blasting_standard: "", paint_make: "", dft_requirement: "" }]);
    setIsModalOpen(true);
  };

  const addPartRow = () => {
    setParts([...parts, { part_number: "", part_description: "", quantity: 1, sop_reference: "", blasting_standard: "", paint_make: "", dft_requirement: "" }]);
  };

  const updatePart = (index: number, field: string, value: string | number) => {
    const newParts = [...parts];
    (newParts[index] as any)[field] = value;
    setParts(newParts);
  };

  const submitParts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/inward/${selectedJob.job_id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parts)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchPendingJobs(); // Refresh table to remove processed job
      } else {
        alert("Failed to save parts. Check the backend terminal for details.");
      }
    } catch (error) {
      console.error("Error saving parts", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QC Work Advice</h1>
            <p className="text-gray-500 mt-2">Pending material intake from Security Gate</p>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading incoming gate passes...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4 font-semibold">Job ID</th>
                  <th className="p-4 font-semibold">Inward Date</th>
                  <th className="p-4 font-semibold">Client</th>
                  <th className="p-4 font-semibold">Challan No.</th>
                  <th className="p-4 font-semibold">Material (Total)</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job: any) => (
                  <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-blue-700">{job.job_id}</td>
                    <td className="p-4 text-gray-700">{job.inward_date}</td>
                    <td className="p-4">
                      <div className="text-gray-900">{job.client_name}</div>
                      {job.parent_client && <div className="text-xs text-gray-500">Parent: {job.parent_client}</div>}
                    </td>
                    <td className="p-4 text-gray-700">{job.dc_number}</td>
                    <td className="p-4 text-gray-700">{job.gross_weight} kg of {job.routing_unit}</td>
                    <td className="p-4 text-right">
                      {/* onClick handler added here */}
                      <button 
                        onClick={() => openModal(job)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
                      >
                        Enter Parts
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No pending materials at the gate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Parts Input Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                Issue QC Work Advice: <span className="text-blue-600">{selectedJob?.job_id}</span>
              </h2>
              
              {parts.map((part, index) => (
                <div key={index} className="grid grid-cols-7 gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <div className="absolute -left-3 -top-3 bg-gray-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 font-semibold mb-1">Part Number</label>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.part_number} onChange={e => updatePart(index, 'part_number', e.target.value)} />
                  </div>
                  <div className="flex flex-col col-span-2">
                    <label className="text-xs text-gray-600 font-semibold mb-1">Description</label>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.part_description} onChange={e => updatePart(index, 'part_description', e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 font-semibold mb-1">Quantity</label>
                    <input type="number" className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.quantity} onChange={e => updatePart(index, 'quantity', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 font-semibold mb-1">Blasting</label>
                    <input placeholder="e.g. SA 2.5" className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.blasting_standard} onChange={e => updatePart(index, 'blasting_standard', e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 font-semibold mb-1">Paint Make</label>
                    <input placeholder="e.g. Jotun" className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.paint_make} onChange={e => updatePart(index, 'paint_make', e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 font-semibold mb-1">DFT (Microns)</label>
                    <input placeholder="e.g. 60-80" className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={part.dft_requirement} onChange={e => updatePart(index, 'dft_requirement', e.target.value)} />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center mt-8 border-t pt-4">
                <button onClick={addPartRow} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md font-semibold transition">
                  + Add Another Part
                </button>
                <div className="space-x-3">
                  <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-md font-semibold transition">
                    Cancel
                  </button>
                  <button onClick={submitParts} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-md transition">
                    Save & Issue Advice
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