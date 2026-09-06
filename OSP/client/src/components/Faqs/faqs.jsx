import { useState } from "react";
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import logo from "../assets/logo.png"; // Ensure the correct path to your logo
import NavbarStudent from "../Navbar/Navbar";

const questions = [
  {
    id: 1,
    question: "How do I apply for a scholarship?",
    answer: "You can apply for a scholarship by clciking the Apply button in any interested Scholarships.",
  },
  {
    id: 2,
    question: "What documents are required for the scholarship application?",
    answer: "The document required are mentioned in view scholarship details section.",
  },
  {
    id: 3,
    question: "When will I know if I've been awarded a scholarship?",
    answer: "Scholarships status will be given by the admin and it can be updated on student side.",
  },
  {
    id: 4,
    question: "Can I apply for multiple scholarships?",
    answer: "Yes, you can apply for multiple scholarships if you meet the eligibility criteria for each.",
  },
];

const Faqs = () => {
  const [activeQuestion, setActiveQuestion] = useState(null);

  const toggleQuestion = (id) => {
    setActiveQuestion((prev) => (prev === id ? null : id));
  };
  return (
    <>
    <NavbarStudent />
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#2563eb", 
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
          background: "#ffffff", 
          padding: "20px",
          borderRadius: "10px",
          color: "#000000",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          minHeight: "500px", 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <img src={logo} alt="Logo" style={{ height: "70px", marginRight: "15px" }} />
          <h1 style={{ fontSize: "32px" }}>FAQs</h1>
        </div>

        {questions.map(({ id, question, answer }) => (
          <div
            key={id}
            style={{
              marginBottom: "15px",
              background: "#f3f4f6", 
              borderRadius: "8px",
              overflow: "hidden",
              transition: "all 0.1s ease-in-out", 
            }}
          >
            <div
              onClick={() => toggleQuestion(id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                cursor: "pointer",
              }}
            >
              <h4 style={{ margin: 0 }}>{question}</h4>
              {activeQuestion === id ? (
                <FaMinusCircle size={20} />
              ) : (
                <FaPlusCircle size={20} />
              )}
            </div>
            <div
              style={{
                maxHeight: activeQuestion === id ? "200px" : "0px",
                opacity: activeQuestion === id ? "1" : "0",
                transition: "all 0.3s ease-in-out",
                overflow: "hidden",
                padding: activeQuestion === id ? "15px" : "0px",
                background: "#e5e7eb", // Slightly darker gray for the answer
              }}
            >
              <p style={{ margin: 0 }}>{answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Faqs;
