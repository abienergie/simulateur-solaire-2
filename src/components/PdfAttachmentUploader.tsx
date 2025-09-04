import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Paperclip, X } from 'lucide-react';

interface PdfAttachment {
  id: string;
  file: File;
  name: string;
}

interface PdfAttachmentUploaderProps {
  attachments: PdfAttachment[];
  onAttachmentsChange: (attachments: PdfAttachment[]) => void;
}

export default function PdfAttachmentUploader({ 
  attachments, 
  onAttachmentsChange 
}: PdfAttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    
    try {
      // Validate files
      const validFiles = files.filter(file => {
        // Check if it's a PDF
        if (file.type !== 'application/pdf') {
          setError('Seuls les fichiers PDF sont acceptés');
          return false;
        }
        
        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          setError('La taille maximale par fichier est de 10MB');
          return false;
        }
        
        return true;
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Create new attachments
      const newAttachments = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        name: file.name
      }));

      // Add to existing attachments
      onAttachmentsChange([...attachments, ...newAttachments]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error processing PDF attachments:', err);
      setError('Une erreur est survenue lors du traitement des fichiers');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Pièces jointes PDF</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Ajouter un fichier
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
          multiple
        />
      </div>
      
      {isUploading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement des fichiers...</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-2">
            Ces fichiers seront ajoutés à la fin du rapport PDF généré
          </p>
          
          <div className="space-y-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {attachments.length === 0 && (
        <p className="text-xs text-gray-500">
          Ajoutez des fichiers PDF (fiches techniques, plans, etc.) qui seront inclus à la fin du rapport
        </p>
      )}
    </div>
  );
}