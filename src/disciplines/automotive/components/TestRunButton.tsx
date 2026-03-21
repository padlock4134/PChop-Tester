import React, { useState } from "react";
import TestRunModal from "./TestRunModal";

const TestRunButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent opening the book
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        className="landing-nav-btn test-run-btn"
        onClick={handleClick}
        type="button"
      >
        Preview
      </button>
      <TestRunModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default TestRunButton;
