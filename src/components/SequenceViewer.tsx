import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  InformationCircleIcon,
  ChartBarIcon,
  ClipboardIcon,
  CheckIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ResidueInfo {
  name: string;
  description: string;
  category: string;
}

interface SequenceStats {
  composition: Record<string, number>;
  percentages: Record<string, number>;
  gc_content?: number;
  molecular_weight?: number;
  length: number;
}

interface SequenceViewerProps {
  sequence: string;
  type: 'dna' | 'protein';
}

interface Selection {
  start: number;
  end: number;
}

interface Match {
  start: number;
  end: number;
  pattern: string;
}

const SequenceRuler = ({ lineIndex, chunkSize = 10 }: { lineIndex: number; chunkSize?: number }) => {
  const startPosition = lineIndex * chunkSize + 1;
  const positions = Array.from({ length: chunkSize }, (_, i) => startPosition + i);
  
  return (
    <div className="flex pl-12 text-[10px] text-slate-400 dark:text-slate-500 select-none sticky left-0">
      <div className="flex-1 flex">
        {positions.map((pos, i) => (
          <span
            key={pos}
            className={`
              flex-1 text-center
              ${i % 5 === 4 ? 'ml-[8.33px]' : ''}
              ${pos % 10 === 0 ? 'font-medium text-slate-500 dark:text-slate-400' : ''}
            `}
          >
            {pos % 5 === 0 ? pos : '·'}
          </span>
        ))}
      </div>
    </div>
  );
};

const SequenceViewer: React.FC<SequenceViewerProps> = ({ sequence, type }) => {
  const [isCollapsed, setIsCollapsed] = useState(sequence.length > 100);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchPattern, setSearchPattern] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [isCopied, setIsCopied] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Add keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle search with Cmd/Ctrl + F
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }

      // Navigate through matches with arrow keys when search is active
      if (showSearch && matches.length > 0) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentMatchIndex(prev => prev > 0 ? prev - 1 : matches.length - 1);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentMatchIndex(prev => prev < matches.length - 1 ? prev + 1 : 0);
        }
      }

      // Close search with Escape
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchPattern('');
          setMatches([]);
          setCurrentMatchIndex(-1);
        } else if (isSelectionMode) {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, matches.length, isSelectionMode]);

  // Scroll to current match
  useEffect(() => {
    if (currentMatchIndex >= 0 && matches.length > 0) {
      const match = matches[currentMatchIndex];
      const lineNumber = Math.floor(match.start / 10);
      const lineElement = document.querySelector(`[data-line="${lineNumber}"]`);
      lineElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, matches]);

  // Calculate sequence statistics
  const stats: SequenceStats = useMemo(() => {
    const composition: Record<string, number> = {};
    const percentages: Record<string, number> = {};
    
    // Count each residue/base
    for (const char of sequence) {
      composition[char] = (composition[char] || 0) + 1;
    }

    // Calculate percentages
    Object.entries(composition).forEach(([char, count]) => {
      percentages[char] = (count / sequence.length) * 100;
    });

    // Calculate GC content for DNA
    const gc_content = type === 'dna' 
      ? ((composition['G'] || 0) + (composition['C'] || 0)) / sequence.length * 100
      : undefined;

    // Calculate molecular weight (approximate)
    const weights = type === 'dna' 
      ? { 'A': 313.2, 'T': 304.2, 'G': 329.2, 'C': 289.2 }
      : {
          'A': 89.1, 'R': 174.2, 'N': 132.1, 'D': 133.1, 'C': 121.2,
          'E': 147.1, 'Q': 146.2, 'G': 75.1, 'H': 155.2, 'I': 131.2,
          'L': 131.2, 'K': 146.2, 'M': 149.2, 'F': 165.2, 'P': 115.1,
          'S': 105.1, 'T': 119.1, 'W': 204.2, 'Y': 181.2, 'V': 117.1
        };

    const molecular_weight = Object.entries(composition).reduce((sum, [char, count]) => {
      return sum + (weights[char as keyof typeof weights] || 0) * count;
    }, 0);

    return {
      composition,
      percentages,
      gc_content,
      molecular_weight,
      length: sequence.length,
    };
  }, [sequence, type]);

  const categoryColors = {
    dna: [
      { category: 'Purine', color: 'bg-green-500 dark:bg-green-400', bases: ['A', 'G'] },
      { category: 'Pyrimidine', color: 'bg-red-500 dark:bg-red-400', bases: ['T', 'C'] },
    ],
    protein: [
      { category: 'Basic', color: 'bg-blue-500 dark:bg-blue-400', residues: ['R', 'H', 'K'] },
      { category: 'Acidic', color: 'bg-red-500 dark:bg-red-400', residues: ['D', 'E'] },
      { category: 'Polar', color: 'bg-green-500 dark:bg-green-400', residues: ['S', 'T', 'N', 'Q'] },
      { category: 'Hydrophobic', color: 'bg-orange-500 dark:bg-orange-400', residues: ['A', 'V', 'L', 'I', 'M', 'F', 'Y', 'W'] },
      { category: 'Special', color: 'bg-purple-500 dark:bg-purple-400', residues: ['P', 'G', 'C'] },
    ],
  };

  const handleToggle = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const getCharacterClassName = (position: number) => {
    const isSelected = selection && 
      position >= selection.start && 
      position <= selection.end;

    const isMatch = matches.length > 0 && currentMatchIndex !== -1 &&
      position >= matches[currentMatchIndex].start && 
      position <= matches[currentMatchIndex].end;

    const isOtherMatch = matches.some((match, index) => 
      index !== currentMatchIndex &&
      position >= match.start && 
      position <= match.end
    );

    return `
      relative inline-block
      ${type === 'dna'
        ? colorMap.dna[sequence[position] as keyof typeof colorMap.dna] || 'text-gray-500'
        : colorMap.protein[sequence[position] as keyof typeof colorMap.protein] || 'text-gray-500'
      } 
      transition-colors duration-200
      ${isSelectionMode ? 'cursor-pointer' : 'cursor-help'}
      ${isSelected ? 'bg-indigo-500/20' : ''}
      ${isMatch ? 'bg-yellow-300/50 dark:bg-yellow-500/50 rounded px-0.5 -mx-0.5' : ''}
      ${isOtherMatch ? 'bg-yellow-100/30 dark:bg-yellow-500/30 rounded px-0.5 -mx-0.5' : ''}
      hover:opacity-75
    `;
  };

  const residueInfo: Record<string, ResidueInfo> = {
    // DNA
    'dA': { name: 'Adenine', description: 'Purine base', category: 'DNA Base' },
    'dT': { name: 'Thymine', description: 'Pyrimidine base', category: 'DNA Base' },
    'dG': { name: 'Guanine', description: 'Purine base', category: 'DNA Base' },
    'dC': { name: 'Cytosine', description: 'Pyrimidine base', category: 'DNA Base' },
    // Protein
    'R': { name: 'Arginine', description: 'Basic, charged', category: 'Basic' },
    'H': { name: 'Histidine', description: 'Basic, charged', category: 'Basic' },
    'K': { name: 'Lysine', description: 'Basic, charged', category: 'Basic' },
    'D': { name: 'Aspartic Acid', description: 'Acidic, charged', category: 'Acidic' },
    'E': { name: 'Glutamic Acid', description: 'Acidic, charged', category: 'Acidic' },
    'S': { name: 'Serine', description: 'Polar, uncharged', category: 'Polar' },
    'T': { name: 'Threonine', description: 'Polar, uncharged', category: 'Polar' },
    'N': { name: 'Asparagine', description: 'Polar, uncharged', category: 'Polar' },
    'Q': { name: 'Glutamine', description: 'Polar, uncharged', category: 'Polar' },
    'A': { name: 'Alanine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'V': { name: 'Valine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'L': { name: 'Leucine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'I': { name: 'Isoleucine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'M': { name: 'Methionine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'F': { name: 'Phenylalanine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'Y': { name: 'Tyrosine', description: 'Hydrophobic', category: 'Hydrophobic' },
    'W': { name: 'Tryptophan', description: 'Hydrophobic', category: 'Hydrophobic' },
    'P': { name: 'Proline', description: 'Special', category: 'Special' },
    'G': { name: 'Glycine', description: 'Special', category: 'Special' },
    'C': { name: 'Cysteine', description: 'Special', category: 'Special' },
  };

  const handleSearch = () => {
    if (!searchPattern) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const newMatches: Match[] = [];
    const pattern = searchPattern.toUpperCase();
    const seq = sequence.toUpperCase();
    
    let index = seq.indexOf(pattern);
    while (index !== -1) {
      newMatches.push({
        start: index,
        end: index + pattern.length - 1,
        pattern: sequence.slice(index, index + pattern.length),
      });
      index = seq.indexOf(pattern, index + 1);
    }

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  };

  const colorMap = {
    dna: {
      'A': 'text-green-500 dark:text-green-400',
      'T': 'text-red-500 dark:text-red-400',
      'G': 'text-yellow-500 dark:text-yellow-400',
      'C': 'text-blue-500 dark:text-blue-400',
      'N': 'text-gray-500 dark:text-gray-400',
    },
    protein: {
      // Hydrophobic residues
      'A': 'text-orange-500 dark:text-orange-400', 
      'V': 'text-orange-500 dark:text-orange-400',
      'L': 'text-orange-500 dark:text-orange-400',
      'I': 'text-orange-500 dark:text-orange-400', 
      'M': 'text-orange-500 dark:text-orange-400',
      'F': 'text-orange-500 dark:text-orange-400',
      'W': 'text-orange-500 dark:text-orange-400',
      'P': 'text-orange-500 dark:text-orange-400',
      // Polar residues
      'S': 'text-green-500 dark:text-green-400',
      'T': 'text-green-500 dark:text-green-400',
      'Y': 'text-green-500 dark:text-green-400',
      'N': 'text-green-500 dark:text-green-400',
      'Q': 'text-green-500 dark:text-green-400',
      'C': 'text-green-500 dark:text-green-400',
      // Basic residues
      'K': 'text-blue-500 dark:text-blue-400',
      'R': 'text-blue-500 dark:text-blue-400',
      'H': 'text-blue-500 dark:text-blue-400',
      // Acidic residues
      'D': 'text-red-500 dark:text-red-400',
      'E': 'text-red-500 dark:text-red-400',
      // Glycine
      'G': 'text-purple-500 dark:text-purple-400',
      // Unknown/other
      'X': 'text-gray-500 dark:text-gray-400',
      '*': 'text-gray-500 dark:text-gray-400',
      '-': 'text-gray-500 dark:text-gray-400',
    }
  };

  const formatSequence = (seq: string): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < seq.length; i += 10) {
      chunks.push(seq.slice(i, i + 10));
    }
    return chunks;
  };

  const handleCharacterHover = (position: number) => {
    setHoveredPosition(position);
  };

  const handleCopySequence = async () => {
    try {
      const textToCopy = selection 
        ? sequence.slice(selection.start, selection.end + 1)
        : sequence;
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy sequence:', err);
    }
  };

  const handleCharacterClick = (position: number) => {
    if (!isSelectionMode) return;

    if (selectionStart === null) {
      setSelectionStart(position);
      setSelection({ start: position, end: position });
    } else {
      const start = Math.min(selectionStart, position);
      const end = Math.max(selectionStart, position);
      setSelection({ start, end });
      setSelectionStart(null);
    }
  };

  const clearSelection = () => {
    setSelection(null);
    setSelectionStart(null);
    setIsSelectionMode(false);
  };

  const getResidueInfo = (char: string, position: number) => {
    const info = residueInfo[char];
    if (!info) return null;

    return (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
        bg-slate-800 text-white rounded px-2 py-1 text-xs whitespace-nowrap z-10
        shadow-lg pointer-events-none
        transition-all duration-200">
        <div className="font-medium">{info.name}</div>
        <div className="text-slate-300 text-[10px]">{info.description}</div>
        <div className="text-slate-400 text-[10px]">Position: {position + 1}</div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1
          border-4 border-transparent border-t-slate-800" />
      </div>
    );
  };

  const displaySequence = isCollapsed ? sequence.slice(0, 100) : sequence;
  const formattedSequence = formatSequence(displaySequence);

  const StatsPanel = () => (
    <div className={`
      absolute top-full right-0 mt-2 p-4 w-80
      bg-white dark:bg-slate-800 rounded-lg shadow-xl
      border border-slate-200 dark:border-slate-700
      transition-all duration-200 z-20
      ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
    `}>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            Sequence Statistics
          </h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Length:</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {stats.length} {type === 'dna' ? 'bases' : 'residues'}
              </span>
            </div>
            {type === 'dna' && stats.gc_content !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">GC Content:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {stats.gc_content.toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Molecular Weight:</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {(stats.molecular_weight || 0).toFixed(1)} Da
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
            Composition
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.percentages)
              .sort(([, a], [, b]) => b - a)
              .map(([char, percentage]) => (
                <div key={char} className="flex items-center gap-2">
                  <span className="text-sm font-mono text-slate-900 dark:text-white min-w-[20px]">
                    {char}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[40px] text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SearchPanel = () => (
    <div className={`
      px-3 py-2 bg-slate-100 dark:bg-slate-800
      border-b border-slate-200 dark:border-slate-700
      transition-all duration-200
      ${showSearch ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}
    `}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchPattern}
            onChange={(e) => setSearchPattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${type.toUpperCase()} sequence...`}
            className="w-full px-3 py-1 text-sm rounded-lg
              bg-white dark:bg-slate-700
              border border-slate-300 dark:border-slate-600
              text-slate-900 dark:text-white
              placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
          {searchPattern && (
            <button
              onClick={() => {
                setSearchPattern('');
                setMatches([]);
                setCurrentMatchIndex(-1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-3 py-1 text-sm rounded-lg
            bg-indigo-600 text-white
            hover:bg-indigo-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!searchPattern}
        >
          Search
        </button>
        {matches.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMatchIndex(prev => 
                prev > 0 ? prev - 1 : matches.length - 1
              )}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              ←
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {currentMatchIndex + 1} / {matches.length}
            </span>
            <button
              onClick={() => setCurrentMatchIndex(prev => 
                prev < matches.length - 1 ? prev + 1 : 0
              )}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              →
            </button>
          </div>
        )}
      </div>
      {matches.length > 0 && (
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Found {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );

  const Legend = () => (
    <div className={`
      absolute top-full right-0 mt-2 p-3 
      bg-white dark:bg-slate-800 rounded-lg shadow-xl
      border border-slate-200 dark:border-slate-700
      transition-all duration-200
      ${showLegend ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
    `}>
      <div className="text-xs font-medium text-slate-900 dark:text-white mb-2">
        {type === 'dna' ? 'Base Types' : 'Residue Categories'}
      </div>
      <div className="space-y-1.5">
        {(type === 'dna' ? categoryColors.dna : categoryColors.protein).map((category, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${category.color}`} />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {category.category}
              <span className="text-slate-400 dark:text-slate-500 ml-1">
                {type === 'dna' 
                  ? (category as { bases: string[] }).bases.join(', ')
                  : (category as { residues: string[] }).residues.join(', ')
                }
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative mt-2 mb-2 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-200 dark:bg-slate-700">
        <div className="flex items-center justify-between px-3 py-1">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {type.toUpperCase()} Sequence ({sequence.length} {type === 'dna' ? 'bases' : 'residues'})
            {selection && (
              <span className="ml-2 text-slate-500 dark:text-slate-400">
                Selected: {selection.end - selection.start + 1} {type === 'dna' ? 'bases' : 'residues'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`
                p-1 rounded-full transition-colors duration-200
                ${showSearch 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400'
                }
              `}
              title="Search sequence (⌘/Ctrl + F)"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`
                p-1 rounded-full transition-colors duration-200
                ${isSelectionMode 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400'
                }
              `}
              title="Toggle selection mode (Esc to exit)"
            >
              <CursorArrowRaysIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCopySequence}
              className="p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600
                transition-colors duration-200"
              title={`Copy ${selection ? 'selected' : 'entire'} sequence`}
            >
              {isCopied ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ClipboardIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`
                p-1 rounded-full transition-colors duration-200
                ${showStats 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400'
                }
              `}
              title="Show sequence statistics"
            >
              <ChartBarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600
                transition-colors duration-200"
              title="Show color legend"
            >
              <InformationCircleIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
            {sequence.length > 100 && (
              <button
                onClick={handleToggle}
                className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 
                  hover:text-slate-900 dark:hover:text-slate-200
                  transition-colors duration-200"
                disabled={isTransitioning}
              >
                <span className="relative">
                  {isCollapsed ? 'Show all' : 'Show less'}
                  <span className={`
                    absolute bottom-0 left-0 w-full h-0.5 
                    bg-current transform origin-left
                    transition-transform duration-200
                    ${isTransitioning ? 'scale-x-0' : 'scale-x-100'}
                  `} />
                </span>
                {isCollapsed ? (
                  <ChevronDownIcon className={`
                    h-3 w-3 transition-transform duration-200
                    ${isTransitioning ? 'rotate-0' : 'rotate-180'}
                  `} />
                ) : (
                  <ChevronUpIcon className={`
                    h-3 w-3 transition-transform duration-200
                    ${isTransitioning ? 'rotate-180' : 'rotate-0'}
                  `} />
                )}
              </button>
            )}
          </div>
        </div>
        <SearchPanel />
      </div>
      {/* Selection Mode Indicator */}
      {isSelectionMode && (
        <div className="sticky top-12 z-10 px-3 py-1 bg-indigo          text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          Click to select start and end positions
          {selection && (
            <button
              onClick={clearSelection}
              className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          title="Keyboard shortcuts"
        >
          <kbd className="text-xs">?</kbd>
        </button>
        {showKeyboardHelp && (
          <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-slate-800
            rounded-lg shadow-xl border border-slate-200 dark:border-slate-700
            text-sm w-64">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700
                  rounded">j/↓</kbd>
                <span className="text-slate-600 dark:text-slate-400">Next line</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700
                  rounded">k/↑</kbd>
                <span className="text-slate-600 dark:text-slate-400">Previous line</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700
                  rounded">gg</kbd>
                <span className="text-slate-600 dark:text-slate-400">Go to start</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700
                  rounded">G</kbd>
                <span className="text-slate-600 dark:text-slate-400">Go to end</span>
              </div>
              <div className="flex justify-between">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700
                  rounded">⌘/Ctrl+F</kbd>
                <span className="text-slate-600 dark:text-slate-400">Search</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="p-4 overflow-x-auto">
          <div className="font-mono text-sm">
            {formattedSequence.map((chunk, lineIndex) => (
              <React.Fragment key={lineIndex}>
                <SequenceRuler lineIndex={lineIndex} />
                <div 
                  data-line={lineIndex}
                  className="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative"
                >
                  <span className="sticky left-0 w-12 text-xs text-slate-500 dark:text-slate-400 
                    select-none bg-white dark:bg-slate-800 group-hover:bg-slate-50 
                    dark:group-hover:bg-slate-800/50 transition-colors z-10">
                    {(lineIndex * 10 + 1).toString().padStart(4, '0')}
                  </span>
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 2 }, (_, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${
                            i % 2 === 0 
                              ? 'bg-slate-50/50 dark:bg-slate-800/25' 
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                    {chunk.split('').map((char, charIndex) => {
                      const position = lineIndex * 10 + charIndex;
                      return (
                        <span
                          key={charIndex}
                          className={`
                            ${getCharacterClassName(position)}
                            relative z-10
                          `}
                          onMouseEnter={() => handleCharacterHover(position)}
                          onMouseLeave={() => setHoveredPosition(null)}
                          onClick={() => handleCharacterClick(position)}
                        >
                          {char}
                          {hoveredPosition === position && getResidueInfo(char, position)}
                          {(charIndex + 1) % 5 === 0 ? ' ' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {isCollapsed && sequence.length > 100 && (
          <div className={`
            mt-2 text-xs text-slate-500 dark:text-slate-400
            transition-all duration-200
            ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}
          `}>
            {sequence.length - 100} more {type === 'dna' ? 'bases' : 'residues'} hidden
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg 
            border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-1">
            <button
              onClick={handleCopySequence}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700
                transition-colors duration-200"
              title={`Copy ${selection ? 'selected' : 'entire'} sequence`}
            >
              {isCopied ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ClipboardIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-lg transition-colors duration-200
                ${showSearch 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              title="Search sequence (⌘/Ctrl + F)"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <Legend />
      <StatsPanel />
    </div>
  );
};

export default SequenceViewer;
