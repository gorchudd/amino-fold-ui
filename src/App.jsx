import './App.css';
import { AMINO_ACIDS } from './constants/aminoAcids';
import { useState, useMemo, useEffect, useCallback } from 'react';

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

function InputPage({sequence, onAminoClick}) {
  const aminoAcidsButtons = useMemo(() => {
    return Array.from(AMINO_ACIDS.keys()).map(aminoName => (
      <button
        key={aminoName}
        onClick={() => onAminoClick(aminoName)}
        className='amino-acid-button'
      >
        <div className='centered-text'>
          {aminoName}
        </div>
      </button>
    ));
  }, [onAminoClick]);

  return (
    <div className='full-page' id='top-down-page'>
      <div className='centered-text container-center-fill' id='top'>
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
      
    </div>
  );
}

export default App