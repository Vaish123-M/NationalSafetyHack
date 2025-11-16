import Button from './Button';

export default function DownloadReport({ interventions, costs }) {
  const handleDownload = () => {
    alert('Report generation feature coming soon!');
    // You can implement pdf generation here using jsPDF or other libs
  };

  return (
    <div className="text-center">
      <Button onClick={handleDownload}>Download Detailed Report</Button>
    </div>
  );
}
