import React from 'react';
import { DocumentUploader } from '../components/upload/DocumentUploader';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

export const UploadPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <DisclaimerBanner />
      <DocumentUploader />
    </div>
  );
};
