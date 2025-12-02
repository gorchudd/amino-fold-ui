import './App.css';
import { AMINO_ACIDS } from './constants/aminoAcids';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';

// ====== sequence helpers ======

export function appendAminoAcid(sequence, aminoFullName) {
  const amino = AMINO_ACIDS.get(aminoFullName); // { one, three }
  return [...sequence, amino];
}

export function removeAminoAcid(sequence) {
  if (sequence.length === 0) return sequence;
  return sequence.slice(0, sequence.length - 1);
}

export function readAminoSequence(sequence) {
  return sequence.map(amino => amino?.three ?? '?').join('-');
}

export function sequenceToOneLetter(sequence) {
  return sequence.map(amino => amino?.one ?? '?').join('');
}

// ====== main app ======

function App() {
  const [page, setPage] = useState(0);      // 0 = input, 1 = output
  const [sequence, setSequence] = useState([]);
  const [pdb, setPdb] = useState(null);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Backspace') {
      setSequence(prev => removeAminoAcid(prev));
    }

    if (event.key === 'Enter') {
      setPdb(null);           // reset prediction when switching pages
      setPage(prev => (prev === 0 ? 1 : 0));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setPdb(null);
  }, [sequence]);

  function handleAminoClick(aminoName) {
    setPdb(null); // force fresh prediction next time we go to output
    setSequence(prev => appendAminoAcid(prev, aminoName));
  }

  // 🔹 For now, stub: we can plug backend here later
  async function handlePredict() {
    console.log('handlePredict called');
    // VERY TEMP: just set a tiny fake PDB so we can see the viewer.
    // Once this works visually, we swap this for the real fetch.
    setPdb(
`ATOM      1  N   GLY A   1      11.104  13.207  10.217  1.00 20.00           N  
ATOM      2  CA  GLY A   1      12.560  13.300  10.091  1.00 20.00           C  
END`
    );
  }

  if (page === 0) {
    return (
      <InputPage
        sequence={sequence}
        onAminoClick={handleAminoClick}
      />
    );
  }

  return (
    <OutputPage
      sequence={sequence}
      pdb={pdb}
      onPredict={handlePredict}
    />
  );
}

// ====== viewer ======

function ProteinViewer({ pdbString }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    console.log('ProteinViewer effect: pdb length =', pdbString?.length);
    console.log('ProteinViewer: has $3Dmol =', !!window.$3Dmol);

    if (!viewerRef.current) return;
    if (!window.$3Dmol) {
      console.error('3Dmol.js is not loaded!');
      return;
    }
    if (!pdbString) return;

    const element = viewerRef.current;
    element.innerHTML = '';

    const viewer = window.$3Dmol.createViewer(element, {
      backgroundColor: 'black',
    });

    // 🔹 Use sticks as a guaranteed-visible fallback
    viewer.addModel(pdbString, 'pdb');
    viewer.setStyle({}, {
      cartoon: { color: 'spectrum' },
      stick: { radius: 0.2 }, // this will show even tiny fragments
    });

    viewer.zoomTo();
    viewer.render();
    viewer.zoom(1.1, 500);
  }, [pdbString]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #ccc',
      }}
    />
  );
}



// ====== pages ======

function InputPage({ sequence, onAminoClick }) {
  const aminoAcidsButtons = useMemo(() => {
    return Array.from(AMINO_ACIDS.keys()).map(aminoName => (
      <button
        key={aminoName}
        onClick={() => onAminoClick(aminoName)}
        className='amino-acid-button'
      >
        {aminoName}
      </button>
    ));
  }, [onAminoClick]);

  return (
    <div className='full-page' id='top-down-page'>
      <div className='container-center-fill' id='top'>
        {readAminoSequence(sequence)}
      </div>
      <div className='container-center-fill' id='down'>
        {aminoAcidsButtons}
      </div>
    </div>
  );
}

function OutputPage({ sequence, pdb, onPredict }) {
  useEffect(() => {
    console.log('OutputPage mounted, calling onPredict');
    onPredict();
  }, [onPredict]);

  console.log('OutputPage render: pdb length =', pdb ? pdb.length : 0);

  return (
    <div className='full-page' id='top-down-page'>
      <div className='container-center-fill' id='sequence'>
        {readAminoSequence(sequence) || '(no sequence yet)'}
      </div>
      <div className='container-center-fill' id='view' style={{ height: '70%' }}>
        {pdb ? (
          <ProteinViewer pdbString={pdb} />
        ) : (
          <div>Waiting for prediction…</div>
        )}
      </div>
    </div>
  );
}

export default App;
