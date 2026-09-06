import { getStoredUserInfo } from "../../utils/storage";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContextState } from "../../context/userProvider";
import NavbarAdmin from "./AdminNavbar";
import { ToastContainer, toast, Bounce } from "react-toastify";

const ApplicantsData = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id, sid } = useParams();
  const { baseURL } = useContextState();
  const userInfo = getStoredUserInfo();
  const [selectedStatus, setSelectedStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch(
          `${baseURL}/api/scholarship/getApplicantData?id=${id}&scholarship_id=${sid}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${userInfo?.token}`,
            },
          },
        );
        if (!response.ok) throw new Error("Failed to load applicant data.");

        const { data } = await response.json();
        setApplicants(data || []);

        const initialStatus = data.reduce((acc, applicant) => {
          acc[applicant.applicant_id] = applicant.status;
          return acc;
        }, {});
        setSelectedStatus(initialStatus);
      } catch (err) {
        toast.error("Error fetching applicant data.");
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [baseURL, id, sid, userInfo?.token]);

  const handleStatusChange = (applicantId, status) => {
    setSelectedStatus((prev) => ({ ...prev, [applicantId]: status }));
  };

  const handleSaveStatus = async (applicantId) => {
    const status = selectedStatus[applicantId];
    try {
      const response = await fetch(`${baseURL}/api/scholarship/statusUpdate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${userInfo?.token}`,
        },
        body: JSON.stringify({
          applicant_id: applicantId,
          s_id: sid,
          statusToUpdate: status,
        }),
      });
      if (!response.ok) throw new Error("Failed to update.");

      const updatedApplicants = [...applicants];
      const index = updatedApplicants.findIndex(
        (app) => app.applicant_id === applicantId,
      );
      if (index !== -1) {
        updatedApplicants[index].status = status;
        setApplicants(updatedApplicants);
      }
      toast.success("Status updated successfully!");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // --- SECURE ADMIN DOCUMENT VIEWER LOGIC ---
  const handleViewDocument = async (
    publicIdOrUrl,
    studentEmail,
    documentTypeKey,
  ) => {
    if (!publicIdOrUrl) return;

    // 1. Backwards Compatibility: Old public URLs
    if (publicIdOrUrl.startsWith("http")) {
      window.open(publicIdOrUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const toastId = toast.loading("Generating secure admin link...");
    try {
      const response = await fetch(
        `${baseURL}/api/user/documents/view/${studentEmail}/${documentTypeKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo?.token}`, // Admin's JWT token
          },
        },
      );

      if (!response.ok) {
        throw new Error("Admin authorization failed to view this document.");
      }

      const data = await response.json();
      toast.dismiss(toastId);

      // Open the securely generated 15-minute URL
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.update(toastId, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <p className="text-slate-500">Loading data...</p>
      </div>
    );

  return (
    <>
      <NavbarAdmin />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="light"
        transition={Bounce}
      />

      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-800">
              Comprehensive Applicant Profile
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              &larr; Back to List
            </button>
          </div>

          <div className="space-y-8">
            {applicants.map((applicant) => (
              <div
                key={applicant.applicant_id}
                className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden"
              >
                {/* Header Section */}
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {applicant.first_name} {applicant.middle_name}{" "}
                      {applicant.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Applicant ID: {applicant.applicant_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <select
                      className="bg-transparent text-slate-700 text-sm font-semibold focus:outline-none cursor-pointer"
                      value={
                        selectedStatus[applicant.applicant_id] ||
                        applicant.status
                      }
                      onChange={(e) =>
                        handleStatusChange(
                          applicant.applicant_id,
                          e.target.value,
                        )
                      }
                    >
                      {[
                        "Accepted",
                        "Rejected",
                        "Under Review",
                        "Documents Verified",
                        "Pending",
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveStatus(applicant.applicant_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-4 rounded-md transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Data Grid Section */}
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      [
                        "Date of Birth",
                        applicant.dob
                          ? new Date(applicant.dob).toLocaleDateString()
                          : "N/A",
                      ],
                      ["Gender", applicant.gender || "N/A"],
                      ["Category", applicant.category || "N/A"],
                      ["Email", applicant.email || "N/A"],
                      ["Mobile", applicant.mobile_number || "N/A"],
                      ["Parent Name", applicant.parent_name || "N/A"],
                      ["Parent Mobile", applicant.parent_mobile || "N/A"],
                      ["Occupation", applicant.occupation || "N/A"],
                      [
                        "Family Income",
                        applicant.income ? `₹${applicant.income}` : "N/A",
                      ],
                      ["Current Semester", applicant.current_semester || "N/A"],
                      [
                        "Year of Admission",
                        applicant.year_of_admission || "N/A",
                      ],
                      ["Department", applicant.department_name || "N/A"],
                      [
                        "Tuition Fees",
                        applicant.tuition_fees
                          ? `₹${applicant.tuition_fees}`
                          : "N/A",
                      ],
                      [
                        "Non-Tuition Fees",
                        applicant.non_tuition_fees
                          ? `₹${applicant.non_tuition_fees}`
                          : "N/A",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="border-b border-slate-100 pb-3"
                      >
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900 font-medium">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Document Links Section */}
                <div className="bg-slate-50 p-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
                    Uploaded Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Income Certificate",
                        url: applicant.income_certificate,
                        key: "incomeCertificate",
                      },
                      {
                        name: "Bank Passbook",
                        url: applicant.bank_passbook,
                        key: "bankPassbook",
                      },
                      {
                        name: "Aadhar Card",
                        url: applicant.aadhar_card,
                        key: "aadharcard",
                      },
                      {
                        name: "Tuition Fee Receipt",
                        url: applicant.tuition_fee_receipt,
                        key: "tuitionFeeReceipt",
                      },
                      {
                        name: "Non-Tuition Fee Receipt",
                        url: applicant.non_tuition_fee_receipt,
                        key: "nonTuitionFeeReceipt",
                      },
                      {
                        name: "Class 10 Marksheet",
                        url: applicant.class_10_mark_sheet,
                        key: "class10MarkSheet",
                      },
                      {
                        name: "Class 12 Marksheet",
                        url: applicant.class_12_mark_sheet,
                        key: "class12MarkSheet",
                      },
                      {
                        name: "Current Education",
                        url: applicant.current_education_mark_sheet,
                        key: "currentEducationMarkSheet",
                      },
                    ].map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        <span className="text-xs font-semibold text-slate-600 truncate mr-2">
                          {doc.name}
                        </span>
                        {doc.url ? (
                          <button
                            onClick={() =>
                              handleViewDocument(
                                doc.url,
                                applicant.email,
                                doc.key,
                              )
                            }
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap bg-transparent border-none cursor-pointer"
                          >
                            View PDF
                          </button>
                        ) : (
                          <span className="text-xs text-red-400 italic whitespace-nowrap">
                            Missing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicantsData;
