
'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '@/lib/firebase';
import { Entry, Rack, Shelf } from '@/components/file-tracker/types';

type LocationData = {
  [room: string]: {
    [rack: string]: Shelf[];
  };
};

type FileTrackerContextType = {
  loading: boolean;
  entries: Entry[];
  companies: string[];
  docTypes: string[];
  racks: Rack[];
  shelves: Shelf[];
  locationData: LocationData;
  setCompanies: React.Dispatch<React.SetStateAction<string[]>>;
  setDocTypes: React.Dispatch<React.SetStateAction<string[]>>;
};

const FileTrackerContext = createContext<FileTrackerContextType | undefined>(undefined);

export const FileTrackerProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);

  useEffect(() => {
    const db = getDatabase(app);

    const entriesRef = ref(db, 'entries');
    const companiesRef = ref(db, 'companies');
    const docTypesRef = ref(db, 'docTypes');
    const racksRef = ref(db, 'racksMetadata');
    const shelvesRef = ref(db, 'shelvesMetadata');

    let loadedDataCount = 0;
    const totalDataSources = 5;
    const checkAllDataLoaded = () => {
        loadedDataCount++;
        if (loadedDataCount === totalDataSources) {
            setLoading(false);
        }
    }

    const entriesUnsub = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEntries: Entry[] = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            dateCreated: new Date(data[key].dateCreated),
            locationHistory: data[key].locationHistory || [],
          }))
        : [];
      setEntries(loadedEntries.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
      checkAllDataLoaded();
    });

    const companiesUnsub = onValue(companiesRef, (snapshot) => {
        if (snapshot.exists()) {
          setCompanies(Object.values(snapshot.val()));
        } else {
          setCompanies([]);
        }
        checkAllDataLoaded();
    });

    const docTypesUnsub = onValue(docTypesRef, (snapshot) => {
        if (snapshot.exists()) {
          setDocTypes(Object.values(snapshot.val()));
        } else {
          setDocTypes([]);
        }
        checkAllDataLoaded();
    });

    const shelvesUnsub = onValue(shelvesRef, (snapshot) => {
        const loadedShelves: Shelf[] = [];
        snapshot.forEach((child) => loadedShelves.push({id: child.key!, ...child.val()}));
        setShelves(loadedShelves);
        
        const racksUnsub = onValue(racksRef, (rackSnapshot) => {
            const loadedRacks: Rack[] = [];
            rackSnapshot.forEach((child) => {
                const rackData = child.val();
                loadedRacks.push({
                    ...rackData,
                    shelves: loadedShelves.filter(s => s.roomNo === rackData.roomNo && s.rackNo === rackData.rackNo)
                                        .sort((a,b) => Number(a.shelfNo) - Number(b.shelfNo))
                });
            });
            setRacks(loadedRacks);
            checkAllDataLoaded();
        });

        checkAllDataLoaded(); // Shelves have loaded

        return () => racksUnsub();
    });
    
    return () => {
      entriesUnsub();
      companiesUnsub();
      docTypesUnsub();
      shelvesUnsub();
    };
  }, []);
  
  const locationData = useMemo(() => {
    const groupedData: LocationData = {};
    shelves.forEach(shelf => {
        const { roomNo, rackNo } = shelf;
        if (roomNo && rackNo) {
            if (!groupedData[roomNo]) groupedData[roomNo] = {};
            if (!groupedData[roomNo][rackNo]) groupedData[roomNo][rackNo] = [];
            groupedData[roomNo][rackNo].push(shelf);
        }
    });
    return groupedData;
  }, [shelves]);

  const value = {
    loading,
    entries,
    companies,
    docTypes,
    racks,
    shelves,
    locationData,
    setCompanies,
    setDocTypes
  };

  return <FileTrackerContext.Provider value={value}>{children}</FileTrackerContext.Provider>;
};

export const useFileTracker = () => {
  const context = useContext(FileTrackerContext);
  if (context === undefined) {
    throw new Error('useFileTracker must be used within a FileTrackerProvider');
  }
  return context;
};
