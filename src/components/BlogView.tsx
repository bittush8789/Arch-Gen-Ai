import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
}

export const BlogView: React.FC<Props> = ({ content }) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl border border-gray-200 shadow-sm">
      <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};
