import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  Layout, 
  Box, 
  FileText, 
  Search, 
  Loader2, 
  ArrowRight, 
  Download,
  Share2,
  History,
  Info
} from 'lucide-react';
import axios from 'axios';
import { Architecture2D } from './components/Architecture2D';
import { Architecture3D } from './components/Architecture3D';
import { BlogView } from './components/BlogView';
import { analyzeArchitecture, generateBlogExplanation, ArchitectureJSON } from './lib/gemini';
import { cn } from './lib/utils';

type Tab = '2d' | '3d' | 'blog';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('2d');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    repoInfo: any;
    architecture: ArchitectureJSON;
    blog: string;
  } | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Backend analysis (file tree)
      const { data: repoInfo } = await axios.post('/api/analyze-repo', { repoUrl });
      
      // 2. AI Analysis (Architecture JSON)
      const architecture = await analyzeArchitecture(repoInfo);
      
      // 3. AI Blog Generation
      const blog = await generateBlogExplanation(repoInfo, architecture);

      setResult({ repoInfo, architecture, blog });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-bottom border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Layout size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">ArchGen AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <History size={16} /> History
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            GitHub Repo → <span className="text-blue-600">Auto Architecture</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 mb-10"
          >
            Instantly visualize any public repository. Generate interactive 2D graphs, 
            3D models, and professional system design documentation powered by AI.
          </motion.p>

          <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Github size={20} />
              </div>
              <input 
                type="text" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full h-14 pl-12 pr-32 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base"
              />
              <button 
                type="submit"
                disabled={loading || !repoUrl}
                className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Analyze</>}
              </button>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm mt-3 flex items-center justify-center gap-1"
              >
                <Info size={14} /> {error}
              </motion.p>
            )}
          </form>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    {result.repoInfo.owner} / {result.repoInfo.repo}
                  </h3>
                  <p className="text-gray-500 text-sm">Architecture analysis complete</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                  <TabButton 
                    active={activeTab === '2d'} 
                    onClick={() => setActiveTab('2d')} 
                    icon={<Layout size={16} />} 
                    label="2D Diagram" 
                  />
                  <TabButton 
                    active={activeTab === '3d'} 
                    onClick={() => setActiveTab('3d')} 
                    icon={<Box size={16} />} 
                    label="3D View" 
                  />
                  <TabButton 
                    active={activeTab === 'blog'} 
                    onClick={() => setActiveTab('blog')} 
                    icon={<FileText size={16} />} 
                    label="Blog Explanation" 
                  />
                </div>
              </div>

              <div className="min-h-[600px]">
                {activeTab === '2d' && <Architecture2D data={result.architecture} />}
                {activeTab === '3d' && <Architecture3D data={result.architecture} />}
                {activeTab === 'blog' && <BlogView content={result.blog} />}
              </div>

              {/* Tech Stack Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.architecture.techStack.map((stack, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{stack.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {stack.technologies.map((tech, j) => (
                        <span key={j} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 pt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  <Download size={18} /> Export SVG
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  <Share2 size={18} /> Share Result
                </button>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-gray-400"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Github size={40} />
                </div>
                <p className="text-lg">Enter a repository URL to begin analysis</p>
                <div className="mt-8 flex gap-8 text-sm opacity-60">
                  <div className="flex items-center gap-2"><ArrowRight size={14} /> AST Parsing</div>
                  <div className="flex items-center gap-2"><ArrowRight size={14} /> Gemini 3.1 Pro</div>
                  <div className="flex items-center gap-2"><ArrowRight size={14} /> D3 & Three.js</div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            Built with Gemini 3.1 Pro & React. Production-ready architecture visualization.
          </p>
        </div>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
