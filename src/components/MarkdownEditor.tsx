"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tab } from '@headlessui/react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex bg-gray-50 border-b border-gray-300">
          <Tab 
            className={({ selected }) => 
              `px-4 py-2 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            Write
          </Tab>
          <Tab 
            className={({ selected }) => 
              `px-4 py-2 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' 
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            Preview
          </Tab>
        </Tab.List>

        <Tab.Panels className="bg-white">
          <Tab.Panel>
            <textarea
              value={value}
              onChange={handleTextChange}
              rows={8}
              className="w-full p-4 focus:outline-none focus:ring-0 resize-none"
              placeholder="Write your announcement content using Markdown..."
            />
          </Tab.Panel>
          <Tab.Panel className="p-4 prose max-w-none min-h-[220px] overflow-auto">
            {value ? (
              <div className="markdown-preview text-gray-900">
                <ReactMarkdown>{value}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-400 italic">
                No content to preview
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 text-xs text-gray-500">
        <p>
          Supports Markdown formatting: <strong>**bold**</strong>, <em>*italic*</em>, 
          <code>`code`</code>, [link](url), # Heading, - list item
        </p>
      </div>
    </div>
  );
} 