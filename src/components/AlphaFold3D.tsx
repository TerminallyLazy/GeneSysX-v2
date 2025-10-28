import React, { useEffect, useRef, useState } from 'react';

interface AlphaFold3DProps {
  accession: string; // UniProt accession
  style?: React.CSSProperties;
}

// Lightweight 3D viewer using 3Dmol.js loaded from CDN; fetches AlphaFold PDB model.
// Note: AlphaFold PDB URL pattern: https://alphafold.ebi.ac.uk/files/AF-<ACC>-F1-model_v4.pdb
declare global { interface Window { $3Dmol?: ThreeDMolLib } }

interface ThreeDMolViewer {
  addModel: (text: string, format: string) => void;
  setStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
  zoomTo: () => void;
  render: () => void;
}
interface ThreeDMolLib {
  createViewer: (el: HTMLElement, opts: { backgroundColor?: string }) => ThreeDMolViewer;
}

export default function AlphaFold3D({ accession, style }: AlphaFold3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureScript() {
      if (window.$3Dmol) return window.$3Dmol;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://3Dmol.org/build/3Dmol.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
        document.head.appendChild(script);
      });
      return (window.$3Dmol as unknown) as ThreeDMolLib;
    }

    async function load() {
      try {
        setError(null);
        const $3Dmol: ThreeDMolLib = await ensureScript();
        if (cancelled) return;
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = '';
        const viewer = $3Dmol.createViewer(el, { backgroundColor: 'white' });
        const pdbUrl = `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v4.pdb`;
        const pdb = await fetch(pdbUrl);
        if (!pdb.ok) throw new Error('PDB not found for this accession');
        const text = await pdb.text();
        viewer.addModel(text, 'pdb');
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        viewer.zoomTo();
        viewer.render();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '3D viewer error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accession]);

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height: 240, ...style }} />
      {error && <div className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</div>}
    </div>
  );
}
