import './App.css';
import { AMINO_ACIDS } from './constants/aminoAcids';
import { userRef, useState, useMemo, useEffect, useCallback } from 'react';
// test
const TEST_PDB = `
ATOM      1  N   GLY A   1      11.104  13.207  10.217  1.00 20.00           N  
ATOM      2  CA  GLY A   1      12.560  13.300  10.091  1.00 20.00           C  
ATOM      3  C   GLY A   1      13.057  14.679   9.658  1.00 20.00           C  
ATOM      4  O   GLY A   1      12.353  15.651   9.873  1.00 20.00           O  
ATOM      5  N   ALA A   2      14.262  14.770   9.036  1.00 20.00           N  
ATOM      6  CA  ALA A   2      14.864  16.053   8.628  1.00 20.00           C  
ATOM      7  C   ALA A   2      14.107  16.613   7.408  1.00 20.00           C  
ATOM      8  O   ALA A   2      13.460  15.892   6.648  1.00 20.00           O  
TER
END
`;


export function appendAminoAcid(sequence, aminoFullName) {
  const amino = AMINO_ACIDS.get(aminoFullName);
  return [...sequence, amino];
}

export function removeAminoAcid(sequence) {
  return sequence.slice(0, sequence.length - 1);
}

export function readAminoSequence(sequence) {
  return sequence.join('-');
}

function App() {
  const [page, setPage] = useState(0);
  const [sequence, setSequence] = useState([]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Backspace') {
      setSequence(prev => removeAminoAcid(prev));
    }

    if (event.key === 'Enter') {
      setPage((prev === 0) ? 1 : 0);
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

  if (page === 0) {
    return <InputPage sequence = {sequence} onAminoClick={handleAminoClick}/>;
  }
  
  return <OutputPage sequence={sequence}/>;
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

function OutputPage({sequence}) {
  return (
    <div className='full-page'>
      <div className='container-center-fill' id='top'>
        {readAminoSequence(sequence)}
      </div>
      <div className='container-center-fill' id='view'>
        <ProteinViewer pdbString={TEST_PDB} />
      </div>
    </div>
  );
}

export default App