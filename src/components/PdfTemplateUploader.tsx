import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PdfTemplateUploaderProps {
  onTemplateUploaded: (url: string) => void;
}

export default function PdfTemplateUploader({ onTemplateUploaded }: PdfTemplateUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier PDF');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Simulate a delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the callback with the URL
      onTemplateUploaded(fileUrl);
      setUploadSuccess(true);
      
      // Reset the success state after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading template:', err);
      setError('Une erreur est survenue lors du chargement du template');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Template PDF personnalisé</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Charger un template
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
      </div>
      
      {isUploading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement du template...</span>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Template chargé avec succès</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Chargez un template PDF contenant des champs de formulaire nommés Text1, Text2, etc.
      </p>
    </div>
  );
}