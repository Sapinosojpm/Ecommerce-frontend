import React, { useEffect, useState } from "react";
import { backendUrl } from "../../../admin/src/App";

const JobPostingPopup = ({ open, onClose }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (open) {
      fetch(`${backendUrl}/api/job-posting`)
        .then((res) => res.json())
        .then((data) => setJobs(data))
        .catch(() => setJobs([]));
    }
  }, [open]);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-4xl shadow-xl relative">
        <h2 className="text-2xl font-semibold text-green-700 mb-6 text-center">Job Postings</h2>

        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100">
          {jobs.length > 0 ? (
            jobs.map((jobItem) => (
              <div key={jobItem._id} className="flex items-center gap-6 mb-6 p-6 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-transform">
                {jobItem.image && (
                  <div className="w-48 h-48 flex-shrink-0 cursor-pointer" onClick={() => setLightboxImage(`${backendUrl}${jobItem.image}`)}>
                    <img src={`${backendUrl}/${jobItem.image.replace(/\\/g, "/")}`} alt={jobItem.title} className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{jobItem.title}</h3>
                  <p className="text-gray-600 my-3">{jobItem.description}</p>
                  <button onClick={() => handleApplyClick(jobItem)} className="inline-block mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition">
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No job postings available at the moment.</p>
          )}
        </div>

        <button onClick={onClose} className="w-full bg-gray-800 text-white py-2 rounded-md mt-4 hover:bg-gray-900 transition">
          Close
        </button>
      </div>

      {/* Lightbox for Image Preview */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Job Preview" className="max-w-3xl max-h-screen rounded-lg shadow-lg" />
        </div>
      )}

      {/* Apply Modal */}
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, resume: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting application:", formData);

    const formDataToSend = new FormData();
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("address", formData.address);
    formDataToSend.append("experience", formData.experience);
    formDataToSend.append("resume", formData.resume);
    formDataToSend.append("jobId", job._id);

    fetch(`${backendUrl}/api/job-applications`, {
      method: "POST",
      body: formDataToSend,
    })
      .then((res) => res.json())
      .then(() => {
        alert("Application submitted successfully!");
        onClose();
      })
      .catch(() => alert("Error submitting application"));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-semibold text-center mb-4">Apply for {job.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Experience</label>
            <textarea name="experience" value={formData.experience} onChange={handleChange} className="w-full border p-2 rounded" rows="3" required></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Upload Resume</label>
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full border p-2 rounded" required />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">Cancel</button>
            <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostingPopup;


