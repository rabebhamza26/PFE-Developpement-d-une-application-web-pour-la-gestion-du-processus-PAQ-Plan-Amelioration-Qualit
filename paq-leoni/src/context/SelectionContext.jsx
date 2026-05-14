// SelectionContext.js - Version avec persistence
import React, { createContext, useContext, useState, useEffect } from 'react';

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [selectedSite, setSelectedSite] = useState(() => {
    const saved = sessionStorage.getItem('selectedSite');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [selectedPlant, setSelectedPlant] = useState(() => {
    const saved = sessionStorage.getItem('selectedPlant');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedSite) {
      sessionStorage.setItem('selectedSite', JSON.stringify(selectedSite));
    } else {
      sessionStorage.removeItem('selectedSite');
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedPlant) {
      sessionStorage.setItem('selectedPlant', JSON.stringify(selectedPlant));
    } else {
      sessionStorage.removeItem('selectedPlant');
    }
  }, [selectedPlant]);

  return (
    <SelectionContext.Provider value={{
      selectedSite,
      setSelectedSite,
      selectedPlant,
      setSelectedPlant
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}