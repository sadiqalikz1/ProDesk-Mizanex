
'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getDatabase, ref, onValue, get } from 'firebase/database';
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
  allEntries: Entry[]; // To provide all entries to the import dialog without sorting
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
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
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

    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          entriesSnap,
          companiesSnap,
          docTypesSnap,
          racksSnap,
          shelvesSnap
        ] = await Promise.all([
          get(entriesRef),
          get(companiesRef),
          get(docTypesRef),
          get(racksRef),
          get(shelvesRef),
        ]);

        const entriesData = entriesSnap.val();
        const loadedEntries: Entry[] = entriesData
          ? Object.keys(entriesData).map((key) => ({
              id: key,
              ...entriesData[key],
              dateCreated: new Date(entriesData[key].dateCreated),
              locationHistory: entriesData[key].locationHistory || [],
            }))
          : [];
        setAllEntries(loadedEntries);
        setEntries(loadedEntries.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));

        setCompanies(companiesSnap.exists() ? Object.values(companiesSnap.val()) : []);
        setDocTypes(docTypesSnap.exists() ? Object.values(docTypesSnap.val()) : []);

        const loadedShelvesData = shelvesSnap.val() || {};
        const loadedShelves: Shelf[] = Object.keys(loadedShelvesData).map(key => ({ id: key, ...loadedShelvesData[key] }));
        setShelves(loadedShelves);
        
        const racksData = racksSnap.val() || {};
        const loadedRacks: Rack[] = Object.keys(racksData).map(key => {
            const rackData = racksData[key];
            return {
                ...rackData,
                id: key,
                shelves: loadedShelves.filter(s => s.roomNo === rackData.roomNo && s.rackNo === rackData.rackNo)
                                    .sort((a,b) => Number(a.shelfNo) - Number(b.shelfNo))
            }
        });
        setRacks(loadedRacks);

      } catch (error) {
        console.error("Firebase initial data fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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
      setAllEntries(loadedEntries);
      setEntries(loadedEntries.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
    });

    const companiesUnsub = onValue(companiesRef, (snapshot) => {
        setCompanies(snapshot.exists() ? Object.values(snapshot.val()) : []);
    });

    const docTypesUnsub = onValue(docTypesRef, (snapshot) => {
        setDocTypes(snapshot.exists() ? Object.values(snapshot.val()) : []);
    });

    const shelvesUnsub = onValue(shelvesRef, (shelvesSnapshot) => {
        const data = shelvesSnapshot.val() || {};
        const loadedShelves: Shelf[] = Object.keys(data).map(key => ({ id: key, ...data[key]}));
        setShelves(loadedShelves);
    });
    
    const racksUnsub = onValue(racksRef, (rackSnapshot) => {
        const data = rackSnapshot.val() || {};
        const loadedRacks: Omit<Rack, 'shelves'>[] = Object.keys(data).map(key => ({ id: key, ...data[key]}));
        setRacks(prevRacks => {
            // This ensures we use the latest shelves state
            return loadedRacks.map(rackData => ({
                ...rackData,
                shelves: shelves.filter(s => s.roomNo === rackData.roomNo && s.rackNo === rackData.rackNo)
                                    .sort((a,b) => Number(a.shelfNo) - Number(b.shelfNo))
            }));
        });
    });
    
    return () => {
      entriesUnsub();
      companiesUnsub();
      docTypesUnsub();
      shelvesUnsub();
      racksUnsub();
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
    // Sort racks within rooms
    for (const room in groupedData) {
        for(const rack in groupedData[room]) {
            groupedData[room][rack].sort((a,b) => Number(a.shelfNo) - Number(b.shelfNo));
        }
    }
    return groupedData;
  }, [shelves]);
  
  // This useEffect ensures that when shelves are updated, the racks' `shelves` array is also updated.
  useEffect(() => {
    setRacks(prevRacks => prevRacks.map(rack => ({
      ...rack,
      shelves: shelves.filter(s => s.roomNo === rack.roomNo && s.rackNo === rack.rackNo)
                       .sort((a,b) => Number(a.shelfNo) - Number(b.shelfNo))
    })));
  }, [shelves]);

  const value = {
    loading,
    entries,
    allEntries,
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
