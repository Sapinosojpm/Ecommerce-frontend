import React, { useEffect, useState } from "react";
import { FiSearch, FiX, FiBriefcase } from "react-icons/fi";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const JobPosting = ({ open, onClose, embedded = false }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open || embedded) {
      fetch(`${backendUrl}/api/job-posting`)
        .then((res) => res.json())
        .then((data) => setJobs(data))
        .catch(() => setJobs([]));
    }
  }, [open, embedded]);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.description && j.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (!open && !embedded) return null;

  return (
    <div className={embedded ? "p-8 bg-white rounded-lg shadow-md" : "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"}>
      <div className="relative w-full max-w-5xl p-6 bg-white rounded-2xl shadow-2xl">
        {!embedded && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10">
            <FiX size={22} />
          </button>
        )}
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-700 tracking-tight">Job Openings</h2>

        <div className="flex items-center mb-8 max-w-md mx-auto bg-gray-50 rounded-full px-4 py-2 shadow-sm border border-gray-200">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((jobItem) => (
              <div
                key={jobItem._id}
                className="flex flex-col h-full bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 p-5 relative group"
              >
                {jobItem.createdAt && (Date.now() - new Date(jobItem.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000) && (
                  <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow">New</span>
                )}
                <div className="flex items-center justify-center mb-4 h-24">
                  {jobItem.image ? (
                    <img src={`${backendUrl}/${jobItem.image.replace(/\\/g, "/")}`} alt={jobItem.title} className="object-cover w-24 h-24 rounded-xl border border-gray-200 shadow-sm" loading="lazy" />
                  ) : (
                    <div className="flex items-center justify-center w-20 h-20 bg-blue-50 rounded-xl border border-gray-200">
                      <FiBriefcase className="text-blue-400 text-3xl" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{jobItem.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{jobItem.description}</p>
                <button
                  onClick={() => handleApplyClick(jobItem)}
                  className="mt-auto px-4 py-2 text-white bg-blue-600 rounded-full font-semibold shadow hover:bg-blue-700 transition"
                >
                  Apply Now
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">No job postings available.</p>
          )}
        </div>
      </div>
      {isApplyModalOpen && selectedJob && (
        <ApplyModal job={selectedJob} onClose={() => setApplyModalOpen(false)} />
      )}
    </div>
  );
};

const ApplyModal = ({ job, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    experience: "",
    resume: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));
    formDataToSend.append("jobId", job._id);

    fetch(`${backendUrl}/api/job-applications`, { method: "POST", body: formDataToSend })
      .then(() => {
        alert("Application submitted successfully!");
        setSubmitting(false);
        onClose();
      })
      .catch(() => {
        alert("Error submitting application");
        setSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10">
          <FiX size={22} />
        </button>
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-700">Apply for {job.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-2 peer-valid:text-xs bg-white px-1">First Name</label>
          </div>
          <div className="relative">
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-2 peer-valid:text-xs bg-white px-1">Last Name</label>
          </div>
          <div className="relative">
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-2 peer-valid:text-xs bg-white px-1">Address</label>
          </div>
          <div className="relative">
            <textarea name="experience" value={formData.experience} onChange={handleChange} className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none" rows="3" required></textarea>
            <label className="absolute left-3 top-4 text-gray-400 text-sm pointer-events-none transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-2 peer-valid:text-xs bg-white px-1">Experience</label>
          </div>
          <div className="relative">
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required />
            <label className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-2 peer-valid:text-xs bg-white px-1">Resume (.pdf, .doc, .docx)</label>
          </div>
          <div className="flex justify-between mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white bg-gray-500 rounded-md">Cancel</button>
            <button type="submit" className="px-6 py-2 text-white bg-green-600 rounded-md font-semibold shadow hover:bg-green-700 transition flex items-center gap-2" disabled={submitting}>
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPosting;
