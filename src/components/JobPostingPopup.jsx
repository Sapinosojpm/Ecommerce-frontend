import React, { useEffect, useState } from "react";
import { backendUrl } from "../../../admin/src/App";

const JobPosting = ({ open, onClose, embedded = false }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);

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

  if (!open && !embedded) return null;

  return (
    <div className={embedded ? "p-8 bg-white rounded-lg shadow-md" : "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"}>
      <div className="relative w-full max-w-4xl p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">Job List</h2>

        <div className="overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-100">
          {jobs.length > 0 ? (
            jobs.map((jobItem) => (
              <div key={jobItem._id} className="flex items-center gap-6 p-6 mb-6 border border-gray-200 rounded-lg shadow-md">
                {jobItem.image && (
                  <img src={`${backendUrl}/${jobItem.image.replace(/\\/g, "/")}`} alt={jobItem.title} className="object-cover w-32 h-32 rounded-lg" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{jobItem.title}</h3>
                  <p className="text-gray-600">{jobItem.description}</p>
                  <button onClick={() => handleApplyClick(jobItem)} className="px-4 py-2 mt-4 text-white bg-black rounded-md hover:bg-gray-700">
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No job postings available.</p>
          )}
        </div>

        {!embedded && (
          <button onClick={onClose} className="w-full py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-900">Close</button>
        )}
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));
    formDataToSend.append("jobId", job._id);

    fetch(`${backendUrl}/api/job-applications`, { method: "POST", body: formDataToSend })
      .then(() => {
        alert("Application submitted successfully!");
        onClose();
      })
      .catch(() => alert("Error submitting application"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-center">Apply for {job.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input type="text" name="address" placeholder="Address" onChange={handleChange} className="w-full p-2 border rounded" required />
          <textarea name="experience" placeholder="Experience" onChange={handleChange} className="w-full p-2 border rounded" rows="3" required></textarea>
          <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full p-2 border rounded" required />
          <div className="flex justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white bg-gray-500 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPosting;
