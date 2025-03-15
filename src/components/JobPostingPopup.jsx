import React, { useEffect, useState } from "react";

const backendUrl =import.meta.env.VITE_BACKEND_URL;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl">
        <h2 className="mb-6 text-2xl font-semibold text-center text-green-700">Job Postings</h2>

        <div className="overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100">
          {jobs.length > 0 ? (
            jobs.map((jobItem) => (
              <div key={jobItem._id} className="flex items-center gap-6 p-6 mb-6 transition-transform border border-gray-200 rounded-lg shadow-md hover:shadow-lg">
                {jobItem.image && (
                  <div className="flex-shrink-0 w-48 h-48 cursor-pointer" onClick={() => setLightboxImage(`${backendUrl}${jobItem.image}`)}>
                    <img src={`${backendUrl}/${jobItem.image.replace(/\\/g, "/")}`} alt={jobItem.title} className="object-cover w-full h-full transition-transform rounded-lg hover:scale-105" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{jobItem.title}</h3>
                  <p className="my-3 text-gray-600">{jobItem.description}</p>
                  <button onClick={() => handleApplyClick(jobItem)} className="inline-block px-4 py-2 mt-4 text-white transition bg-green-600 rounded-md hover:bg-green-700">
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No job postings available at the moment.</p>
          )}
        </div>

        <button onClick={onClose} className="w-full py-2 mt-4 text-white transition bg-gray-800 rounded-md hover:bg-gray-900">
          Close
        </button>
      </div>

      {/* Lightbox for Image Preview */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setLightboxImage(null)}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-center">Apply for {job.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Experience</label>
            <textarea name="experience" value={formData.experience} onChange={handleChange} className="w-full p-2 border rounded" rows="3" required></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Upload Resume</label>
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full p-2 border rounded" required />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostingPopup;


