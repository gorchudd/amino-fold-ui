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
  }, [handleKeyDown])

  function handleAminoClick(aminoName) {
    setSequence(prev => appendAminoAcid(prev, aminoName));
  }

  // vibed
  async function handlePredict() {
    if (pdb) return;
    
    const seqOneLetter = sequenceToOneLetter(sequence);
    if (!seqOneLetter) return;

    try {
      const res = await fetch('/api/predict', {
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
    // safety: if no dom node or 3Dmol not loaded
    if (!viewerRef.current || !window.$3Dmol || !pdbString) return;

    const element = viewerRef.current;

    // clear any previous viewer content
    element.innerHTML = '';

    const config = { backgroundColor: 'white' };
    const viewer = window.$3Dmol.createViewer(element, config);

    viewer.addModel(pdbString, 'pdb');
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    viewer.zoomTo();
    viewer.render();

    // optional: small zoom animation
    // viewer.zoom(1.1, 500);

  }, [pdbString]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
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