import React, { useRef } from 'react';
import Button from './Button';

export default function FileUpload({ onUpload }) {
  const fileInput = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fileInput.current.files.length === 0) {
      alert('Please select a file to upload.');
      return;
    }
    onUpload(fileInput.current.files[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex justify-center">
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.txt,.csv"
        className="text-black p-2 rounded-l border border-r-0 border-gray-300"
      />
      <Button type="submit" className="rounded-l-none">
        Upload Report
      </Button>
    </form>
  );
}
