import './App.css';
import { AMINO_ACIDS } from './constants/aminoAcids';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';

export function appendAminoAcid(sequence, aminoFullName) {
  const amino = AMINO_ACIDS.get(aminoFullName);
  return [...sequence, amino];
}

export function removeAminoAcid(sequence) {
  return sequence.slice(0, sequence.length - 1);
}

export function readAminoSequence(sequence) {
  return sequence.map(amino => amino.three).join('-');
}

export function sequenceToOneLetter(sequence) {
  return sequence.map(amino => amino.one).join('');
}

function App() {
  const [page, setPage] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [pdb, setPdb] = useState(null);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Backspace') {
      setSequence(prev => removeAminoAcid(prev));
    }

    if (event.key === 'Enter') {
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
    setSequence(prev => appendAminoAcid(prev, aminoName));
  }

  // vibed
  const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8000'                         // local dev
    : 'https://amino-fold-backend.onrender.com';      // Render URL (replace with yours)

  async function handlePredict() {
    const seqOneLetter = sequenceToOneLetter(sequence);
    if (!seqOneLetter) {
      setPdb(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: seqOneLetter }),
      });

      if (!res.ok) {
        console.error('Predict failed', res.status);
        return;
      }

      const data = await res.json();
      setPdb(data.pdb);
    } catch (err) {
      console.error('Error calling backend', err);
    }
  }




  if (page === 0) {
    return <InputPage sequence = {sequence} onAminoClick={handleAminoClick}/>;
  }
  
  return <OutputPage
    sequence={sequence}
    pdb={pdb}
    onPredict={handlePredict}
  />;
}

// vibed
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

function InputPage({sequence, onAminoClick}) {
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
    onPredict();
  }, [onPredict]);

  return (
    <div className='full-page' id='top-down-page'>
      <div className='container-center-fill' id='sequence'>
        {readAminoSequence(sequence)}
      </div>
      <div className='container-center-fill' id='view'>
        {pdb ? (
          <ProteinViewer pdbString={pdb} />
        ) : (
          <div className='container-center-fill'>Waiting for prediction…</div>
        )}
      </div>
    </div>
  );
}

export default App