'use client';

import { useState } from 'react';
import { DocumentVersion } from '@/types/personnel';
import { ClockIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface DocumentVersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId: string;
  onVersionSelect: (versionId: string) => void;
}

export default function DocumentVersionHistory({
  versions,
  currentVersionId,
  onVersionSelect
}: DocumentVersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleVersionDetails = (versionId: string) => {
    if (expandedVersion === versionId) {
      setExpandedVersion(null);
    } else {
      setExpandedVersion(versionId);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {versions.map((version) => (
          <li key={version.versionId}>
            <div className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon 
                      className={`h-5 w-5 mr-2 ${
                        version.versionId === currentVersionId 
                          ? 'text-green-500' 
                          : 'text-gray-400'
                      }`} 
                    />
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {version.versionId === currentVersionId ? (
                        <span className="inline-flex items-center">
                          Version {version.versionId.split('-').pop()}
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Current
                          </span>
                        </span>
                      ) : (
                        `Version ${version.versionId.split('-').pop()}`
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {version.versionId !== currentVersionId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onVersionSelect(version.versionId)}
                        className="text-xs"
                      >
                        Restore
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleVersionDetails(version.versionId)}
                      className="text-xs"
                    >
                      {expandedVersion === version.versionId ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {formatDate(version.uploadDate)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Uploaded by: {version.uploadedBy}
                    </p>
                  </div>
                </div>
                
                {expandedVersion === version.versionId && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Version Notes</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {version.notes || 'No notes provided for this version.'}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={version.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 