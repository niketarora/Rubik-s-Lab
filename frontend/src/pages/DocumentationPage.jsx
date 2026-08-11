import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import PseudocodeBlock from '../components/common/PseudocodeBlock';
import { MOCK_DOCS } from '../services/mockData';

const DocumentationPage = () => {
  const { topic } = useParams();
  const navigate = useNavigate();

  // Redirect to overview if no topic is specified
  useEffect(() => {
    if (!topic) {
      navigate('/docs/overview');
    }
  }, [topic, navigate]);

  const activeTopic = topic || 'overview';
  const doc = MOCK_DOCS[activeTopic] || MOCK_DOCS['overview'];

  // Sidebar grouping
  const sections = [
    {
      header: "GETTING STARTED",
      items: [
        { key: "overview", label: "Overview" },
      ]
    },
    {
      header: "ALGORITHMS",
      items: [
        { key: "bfs", label: "Breadth-First Search" },
        { key: "dfs", label: "Depth-First Search" },
        { key: "iddfs", label: "Iterative Deepening DFS" },
        { key: "ida-star", label: "IDA* Heuristic Search" },
      ]
    },
    {
      header: "HEURISTICS",
      items: [
        { key: "heuristics", label: "Heuristics & Lower Bounds" },
      ]
    }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8 select-none font-sans min-h-[calc(100vh-128px)]">
      {/* Left Sidebar Table of Contents */}
      <aside className="w-full md:w-[240px] flex-shrink-0 flex flex-col gap-6 select-none border-b md:border-b-0 md:border-r border-subtle pb-6 md:pb-0 md:pr-6">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-2">
            <h5 className="text-[11px] font-bold text-secondary uppercase tracking-widest font-sans">
              {sec.header}
            </h5>
            <ul className="flex flex-col gap-1">
              {sec.items.map((item) => (
                <li key={item.key}>
                  <Link
                    to={`/docs/${item.key}`}
                    className={`block py-1 text-[13px] font-medium font-sans transition-colors ${
                      activeTopic === item.key
                        ? 'text-accent-blue font-bold'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Main Content Column */}
      <main className="flex-grow flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-bold text-primary font-sans leading-tight">
            {doc.title}
          </h1>
        </div>

        {/* Content body text */}
        <div className="text-[14px] text-secondary leading-relaxed font-sans flex flex-col gap-4 whitespace-pre-line border-b border-subtle pb-6">
          {doc.content}
        </div>

        {/* IDA* Specific content additions (Pruning diagram, pseudocode, complexity cards) */}
        {activeTopic === 'ida-star' && (
          <div className="flex flex-col gap-6 mt-2">
            {/* Pruning Diagram Card */}
            <Card title="Search Tree Threshold Pruning Diagram" subtitle="Visual representation of branch cutoffs in IDA*">
              <div className="flex justify-center py-4 bg-gray-50 border border-subtle rounded-btn">
                <svg width="340" height="200" viewBox="0 0 340 200" className="select-none font-mono">
                  {/* Root Node */}
                  <circle cx="170" cy="30" r="16" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2.5" />
                  <text x="170" y="34" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16A34A">s0</text>
                  
                  {/* Branch lines to Level 1 */}
                  <line x1="170" y1="46" x2="80" y2="90" stroke="#9CA3AF" strokeWidth="1.5" />
                  <line x1="170" y1="46" x2="260" y2="90" stroke="#9CA3AF" strokeWidth="1.5" />

                  {/* Level 1 Kept Node (Left) */}
                  <circle cx="80" cy="100" r="14" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" />
                  <text x="80" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#16A34A">g=1</text>
                  
                  {/* Level 1 Pruned Node (Right) */}
                  <circle cx="260" cy="100" r="14" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
                  <text x="260" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#DC2626">g=1</text>

                  {/* Branch lines to Level 2 (left side only) */}
                  <line x1="80" y1="114" x2="40" y2="150" stroke="#9CA3AF" strokeWidth="1.5" />
                  <line x1="80" y1="114" x2="120" y2="150" stroke="#9CA3AF" strokeWidth="1.5" />

                  {/* Level 2 Kept Nodes */}
                  <circle cx="40" cy="160" r="12" fill="#FFFFFF" stroke="#16A34A" strokeWidth="1.5" />
                  <text x="40" y="163" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#16A34A">g=2</text>

                  <circle cx="120" cy="160" r="12" fill="#FFFFFF" stroke="#16A34A" strokeWidth="1.5" />
                  <text x="120" y="163" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#16A34A">g=2</text>

                  {/* Pruning Threshold dotted Line */}
                  <line x1="10" y1="125" x2="330" y2="125" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="5,4" />
                  <text x="325" y="120" textAnchor="end" fontSize="9" fill="#DC2626" fontWeight="bold">PRUNING THRESHOLD F(N) &gt; 12</text>

                  {/* Small Label annotations */}
                  <text x="260" y="123" textAnchor="middle" fontSize="8" fill="#DC2626" fontWeight="bold">h=12 (f=13 &gt; 12)</text>
                  <text x="260" y="135" textAnchor="middle" fontSize="8" fill="#DC2626" fontWeight="bold">[PRUNED]</text>
                  
                  <text x="80" y="75" textAnchor="end" fontSize="8" fill="#6B7280">h=9 (f=10)</text>
                  <text x="260" y="75" textAnchor="start" fontSize="8" fill="#6B7280">h=12 (f=13)</text>
                </svg>
              </div>
            </Card>

            {/* Pseudocode Block */}
            <PseudocodeBlock
              title="IDA* SOLVER PSEUDOCODE"
              code={doc.pseudocode}
            />

            {/* Complexity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="flex flex-col gap-2 p-5 border border-subtle bg-surface">
                <span className="text-[11px] font-bold text-accent-red uppercase tracking-wider">
                  {doc.complexity.time.label}
                </span>
                <span className="font-mono text-[24px] font-extrabold text-primary font-mono leading-none">
                  {doc.complexity.time.value}
                </span>
                <p className="text-secondary text-[12px] mt-1 font-sans">
                  {doc.complexity.time.desc}
                </p>
              </Card>
              <Card className="flex flex-col gap-2 p-5 border border-subtle bg-surface">
                <span className="text-[11px] font-bold text-accent-green uppercase tracking-wider">
                  {doc.complexity.space.label}
                </span>
                <span className="font-mono text-[24px] font-extrabold text-primary font-mono leading-none">
                  {doc.complexity.space.value}
                </span>
                <p className="text-secondary text-[12px] mt-1 font-sans">
                  {doc.complexity.space.desc}
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentationPage;
