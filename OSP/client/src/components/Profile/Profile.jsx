import { getStoredUserInfo } from "../../utils/storage";
import React, { useState, useEffect } from "react";
import NavbarStudent from "../Navbar/StudentNavbar";
import BankDetails from "./BankDetails";
import CommunicationAddress from "./CommunicationAddress";
import PersonalDetails from "./PersonalDetails";
import CurrentAcademicDetails from "./CurrentAcademicDetails";
import Class10Details from "./Class10Details";
import Class12Details from "./Class12Details";
import CurrentEducationDetails from "./CurrentEducationDetails";
import { useContextState, authHeaders } from "../../context/userProvider";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const { baseURL } = useContextState();
  const [isSaving, setIsSaving] = useState(false);

  // --- AUTO SAVE STATES ---
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [pdfFiles, setPdfFiles] = useState({
    incomeCertificate: null,
    bankPassbook: null,
    aadharcard: null,
    tuitionFeeReceipt: null,
    nonTuitionFeeReceipt: null,
    class10MarkSheet: null,
    class12MarkSheet: null,
    currentEducationMarkSheet: null,
  });

  const [cloudinaryUrls, setCloudinaryUrls] = useState({
    incomeCertificate: "",
    bankPassbook: "",
    aadharcard: "",
    tuitionFeeReceipt: "",
    nonTuitionFeeReceipt: "",
    class10MarkSheet: "",
    class12MarkSheet: "",
    currentEducationMarkSheet: "",
  });

  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    dob: "",
    gender: "",
    category: "",
    email: "",
    mobileNumber: "",
    parentName: "",
    occupation: "",
    parentMobile: "",
    incomelimit: "",
    village: "",
    block: "",
    state: "",
    pin: "",
    bankAccount: "",
    ifscCode: "",
    bankName: "",
    bankBranch: "",
    courseLevel: "",
    courseName: "",
    tuitionFees: "",
    nonTuitionFees: "",
    class10Institute: "",
    class10PassingDate: "",
    class10MarksObtained: "",
    class10TotalMarks: "",
    class12Institute: "",
    class12PassingDate: "",
    class12MarksObtained: "",
    class12TotalMarks: "",
    currentEducationBatch: "",
    currentCgpaObtained: "",
    currentCgpaTotal: "",
    currentSemester: "",
  });

  const [class10ValidationError, setClass10ValidationError] = useState(false);
  const [class12ValidationError, setClass12ValidationError] = useState(false);
  const [educationdetailserror, setEducationdetailserror] = useState(false);
  const [Academicdetailserror, setAcademicdetailserror] = useState(false);
  const [Bankdetailserror, setBankdetailserror] = useState(false);
  const [communicationAddress, setcommunicationAddress] = useState(false);

  // 1. LOAD DATA (DB + LOCAL DRAFT)
  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (!userInfo || !userInfo.email) return;

    const email = userInfo.email;

    const loadProfileData = async () => {
      try {
        // Fetch PDFs from DB
        const pdfRes = await fetch(`${baseURL}/api/user/getpdfurls/${email}`, {
          headers: { ...authHeaders() },
        });
        if (pdfRes.ok) {
          const pdfData = await pdfRes.json().catch(() => ({}));
          setCloudinaryUrls({
            incomeCertificate: String(pdfData.incomeCertificate || ""),
            bankPassbook: String(pdfData.bankPassbook || ""),
            aadharcard: String(pdfData.aadharcard || ""),
            tuitionFeeReceipt: String(pdfData.tuitionFeeReceipt || ""),
            nonTuitionFeeReceipt: String(pdfData.nonTuitionFeeReceipt || ""),
            class10MarkSheet: String(pdfData.class10MarkSheet || ""),
            class12MarkSheet: String(pdfData.class12MarkSheet || ""),
            currentEducationMarkSheet: String(
              pdfData.currentEducationMarkSheet || "",
            ),
          });
        }

        // Fetch Profile from DB
        const profileRes = await fetch(
          `${baseURL}/api/user/getprofile/${email}`,
          {
            headers: { ...authHeaders() },
          },
        );

        let dbMappedData = { email }; // Default base

        if (profileRes.ok) {
          const data = await profileRes.json().catch(() => ({}));
          dbMappedData = {
            firstname: String(data.first_name || ""),
            middlename: String(data.middle_name || ""),
            lastname: String(data.last_name || ""),
            dob: String(data.dob || ""),
            gender: String(data.gender || ""),
            category: String(data.category || ""),
            email: String(data.email || email),
            mobileNumber: String(data.mobileNumber || ""),
            parentName: String(data.parent_name || ""),
            occupation: String(data.occupation || ""),
            parentMobile: String(data.parentMobile || ""),
            incomelimit: String(data.incomelimit || ""),
            village: String(data.village || ""),
            block: String(data.block || ""),
            state: String(data.state || ""),
            pin: String(data.pin || ""),
            bankAccount: String(data.bankAccount || ""),
            ifscCode: String(data.ifscCode || ""),
            bankName: String(data.bank_name || ""),
            bankBranch: String(data.branch_name || ""),
            courseLevel: String(data.courseLevel || ""),
            courseName: String(data.courseName || ""),
            tuitionFees: String(data.tuitionFees || ""),
            nonTuitionFees: String(data.nonTuitionFees || ""),
            class10Institute: String(data.class10Institute || ""),
            class10PassingDate: String(data.class10PassingDate || ""),
            class10MarksObtained: String(data.class10MarksObtained || ""),
            class10TotalMarks: String(data.class10TotalMarks || ""),
            class12Institute: String(data.class12Institute || ""),
            class12PassingDate: String(data.class12PassingDate || ""),
            class12MarksObtained: String(data.class12MarksObtained || ""),
            class12TotalMarks: String(data.class12TotalMarks || ""),
            currentEducationBatch: String(data.currentEducationBatch || ""),
            currentCgpaObtained: String(data.currentCgpaObtained || ""),
            currentCgpaTotal: String(data.currentCgpaTotal || ""),
            currentSemester: String(data.current_semester || ""),
          };
        }

        // --- MERGE WITH LOCAL DRAFT (IF EXISTS) ---
        const localDraftString = localStorage.getItem(`profileDraft_${email}`);
        if (localDraftString) {
          const localDraft = JSON.parse(localDraftString);
          setFormData({ ...dbMappedData, ...localDraft }); // Local overrides DB
          toast.info("Unsaved draft restored locally.", { autoClose: 3000 });
        } else {
          setFormData(dbMappedData);
        }
      } catch (err) {
        toast.error("Could not load existing profile data.");
      } finally {
        setIsInitialLoad(false); // Enable auto-saving now that load is done
      }
    };

    loadProfileData();
  }, [baseURL]);

  // 2. THE AUTO-SAVE ENGINE (DEBOUNCER)
  useEffect(() => {
    if (isInitialLoad || !formData.email) return;

    // Wait 2 seconds after the user stops typing to save locally
    const timer = setTimeout(() => {
      localStorage.setItem(
        `profileDraft_${formData.email}`,
        JSON.stringify(formData),
      );
      setLastSavedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 2000);

    // Clear timeout if they type again before 2 seconds
    return () => clearTimeout(timer);
  }, [formData, isInitialLoad]);

  const handlePdfUpload = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFiles((prev) => ({ ...prev, [key]: file }));
    const formData2 = new FormData();
    formData2.append("file", file);

    const toastId = toast.loading(`Uploading ${key}...`);
    try {
      const response = await fetch(
        `${baseURL}/api/user/pdf/${formData.email}/${key}`,
        {
          method: "POST",
          headers: { ...authHeaders() },
          body: formData2,
        },
      );

      if (!response.ok) throw new Error("Upload failed.");
      const data = await response.json();

      setCloudinaryUrls((prev) => ({
        ...prev,
        [key]: data.documentId || data.cloudinaryUrl,
      }));

      toast.update(toastId, {
        render: "Document uploaded securely!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "Error uploading document",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const clearPdfFile = async (key) => {
    setPdfFiles((prev) => ({ ...prev, [key]: null }));
    setCloudinaryUrls((prev) => ({ ...prev, [key]: "" }));

    try {
      const response = await fetch(
        `${baseURL}/api/user/clearpdf/${formData.email}/${key}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) throw new Error("Failed to clear cloud file.");
      toast.info("Document removed.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const viewFile = async (publicIdOrUrl) => {
    if (!publicIdOrUrl) return;

    if (publicIdOrUrl.startsWith("http")) {
      window.open(publicIdOrUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const documentTypeKey = Object.keys(cloudinaryUrls).find(
      (key) => cloudinaryUrls[key] === publicIdOrUrl,
    );

    if (!documentTypeKey) {
      toast.error("Document reference not found.");
      return;
    }

    const toastId = toast.loading("Generating secure link...");
    try {
      const response = await fetch(
        `${baseURL}/api/user/documents/view/${formData.email}/${documentTypeKey}`,
        {
          method: "GET",
          headers: { ...authHeaders() },
        },
      );

      if (!response.ok)
        throw new Error("You are not authorized to view this document.");

      const data = await response.json();
      toast.dismiss(toastId);
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

  const handleSave = async (e) => {
    e.preventDefault();

    if (
      class10ValidationError ||
      class12ValidationError ||
      educationdetailserror ||
      Academicdetailserror ||
      Bankdetailserror ||
      communicationAddress
    ) {
      toast.error("Please resolve form validation errors before saving.");
      return;
    }

    const requiredDocs = [
      "incomeCertificate",
      "bankPassbook",
      "aadharcard",
      "tuitionFeeReceipt",
      "nonTuitionFeeReceipt",
      "class10MarkSheet",
      "class12MarkSheet",
      "currentEducationMarkSheet",
    ];

    for (const doc of requiredDocs) {
      if (!cloudinaryUrls[doc]) {
        toast.error(
          `Please upload your ${doc.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${baseURL}/api/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success("Profile saved successfully!");
        // --- CLEAR DRAFT AFTER SUCCESSFUL DB SAVE ---
        localStorage.removeItem(`profileDraft_${formData.email}`);
        setLastSavedTime(null);
      } else {
        toast.error(data.message || "Failed to save profile.");
      }
    } catch (error) {
      toast.error("Network error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <NavbarStudent />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={2}
        newestOnTop={true}
        theme="light"
        transition={Bounce}
      />

      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Student Profile
              </h1>
              <p className="text-slate-500 mt-2">
                Manage your personal, academic, and financial records.
              </p>
            </div>
            {/* Display Auto-save status */}
            {lastSavedTime && (
              <div className="mt-4 md:mt-0 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                Draft auto-saved at {lastSavedTime}
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <PersonalDetails
              formData={formData}
              handleInputChange={handleInputChange}
            />
            <CommunicationAddress
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setcommunicationAddress}
            />
            <BankDetails
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setBankdetailserror}
            />
            <CurrentAcademicDetails
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setAcademicdetailserror}
            />
            <Class10Details
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setClass10ValidationError}
            />
            <Class12Details
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setClass12ValidationError}
            />
            <CurrentEducationDetails
              formData={formData}
              handleInputChange={handleInputChange}
              pdfFiles={pdfFiles}
              handlePdfUpload={handlePdfUpload}
              clearPdfFile={clearPdfFile}
              cloudinaryUrls={cloudinaryUrls}
              viewFile={viewFile}
              setValidationErrorStatus={setEducationdetailserror}
            />

            <div className="flex flex-col sm:flex-row items-center justify-end pt-4 gap-4">
              {lastSavedTime && (
                <span className="text-sm text-slate-500 italic">
                  Don't worry, your progress is safely saved locally.
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? "Validating & Saving..."
                  : "Submit Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
