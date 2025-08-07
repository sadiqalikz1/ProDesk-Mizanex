
export type LocationHistory = {
  date: string;
  location: string;
  status: string;
  updatedBy: string;
  notes: string;
};

export type Entry = {
  id: string;
  fileNo: string;
  fileType: string;
  company: string;
  dateCreated: Date;
  description: string;
  owner: string;
  roomNo: string;
  rackNo: string;
  boxNo: string;
  status: string;
  locationHistory: LocationHistory[];
};
