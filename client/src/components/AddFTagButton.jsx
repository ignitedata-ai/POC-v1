/**
 * AddFTagButton.jsx
 *
 * Button at the top of the left sidebar that opens a dropdown menu
 * with 4 options for creating a new F-Tag template:
 *   1. Upload PDF
 *   2. Create from Template
 *   3. Duplicate from Existing
 *   4. Create Blank
 */

import React, { useState, useRef, useEffect } from 'react';

const OPTIONS = [
  {
    id: 'upload-pdf',
    label: 'Upload PDF',
    description: 'Import from a PDF document',
    icon: '\u2191', // up arrow
  },
  {
    id: 'from-template',
    label: 'Create from Template',
    description: 'Start with the standard packet template',
    icon: '\u2750', // document icon
  },
  {
    id: 'duplicate',
    label: 'Duplicate from Existing',
    description: 'Copy an existing F-Tag template',
    icon: '\u2398', // copy icon
  },
  {
    id: 'blank',
    label: 'Create Blank',
    description: 'Start with an empty document',
    icon: '+',
  },
];

export default function AddFTagButton({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function handleOptionClick(optionId) {
    setIsOpen(false);
    onSelect(optionId);
  }

  return (
    <div className="add-ftag-wrapper" ref={dropdownRef}>
      <button
        className="add-ftag-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="add-ftag-btn-icon">+</span>
        <span>Add New F-Tag</span>
      </button>

      {isOpen && (
        <div className="add-ftag-dropdown">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              className="add-ftag-option"
              onClick={() => handleOptionClick(option.id)}
            >
              <span className="add-ftag-option-icon">{option.icon}</span>
              <div className="add-ftag-option-text">
                <span className="add-ftag-option-label">{option.label}</span>
                <span className="add-ftag-option-desc">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
