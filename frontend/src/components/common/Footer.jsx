import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-subtle mt-auto font-sans select-none">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand block (spans 2 cols on wide viewports) */}
          <div className="md:col-span-2">
            <h4 className="font-extrabold text-[16px] text-primary tracking-tight font-sans uppercase">
              RUBIK'S ALGORITHM LAB
            </h4>
            <p className="text-secondary text-[13px] leading-relaxed mt-3 max-w-md font-sans">
              Demystifying state-space search, heuristic design, and combinatorial optimization through the lens of the world's favorite puzzle.
            </p>
          </div>

          {/* Column 2: ALGORITHMS */}
          <div>
            <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider font-sans mb-3">
              ALGORITHMS
            </h5>
            <ul className="flex flex-col gap-2">
              <li>
                <Link to="/docs/bfs" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Breadth-First Search (BFS)
                </Link>
              </li>
              <li>
                <Link to="/docs/dfs" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Depth-First Search (DFS)
                </Link>
              </li>
              <li>
                <Link to="/docs/iddfs" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Iterative Deepening DFS (IDDFS)
                </Link>
              </li>
              <li>
                <Link to="/docs/ida-star" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Korf's IDA* Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: LABORATORY */}
          <div>
            <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider font-sans mb-3">
              LABORATORY
            </h5>
            <ul className="flex flex-col gap-2">
              <li>
                <Link to="/solve" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Solver Workspace
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Compare Metrics
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Algorithm Docs
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-secondary hover:text-accent-blue text-[13px] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider and links */}
        <div className="border-t border-subtle mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted font-sans">
            &copy; {new Date().getFullYear()} Rubik's Algorithm Laboratory. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent-blue hover:text-blue-700 text-[12px] font-semibold hover:underline"
            >
              GitHub Repository
            </a>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
            <Link
              to="/docs"
              className="text-accent-blue hover:text-blue-700 text-[12px] font-semibold hover:underline"
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
