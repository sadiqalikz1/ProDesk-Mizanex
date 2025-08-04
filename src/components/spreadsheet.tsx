'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ROWS = 20;
const COLS = 10;

// Create an initial empty grid
const initialGrid = Array.from({ length: ROWS }, () =>
  Array(COLS).fill('')
);

export default function Spreadsheet() {
  const [gridData, setGridData] = useState(initialGrid);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const newData = [...gridData];
    newData[rowIndex][colIndex] = e.target.value;
    setGridData(newData);
  };

  const getColumnName = (index: number) => {
    let name = '';
    let n = index;
    while (n >= 0) {
      name = String.fromCharCode((n % 26) + 65) + name;
      n = Math.floor(n / 26) - 1;
    }
    return name;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spreadsheet</CardTitle>
        <CardDescription>
          A simple, in-app spreadsheet for your data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="border-collapse border border-border table-fixed w-full">
            <thead>
              <tr>
                <th className="border border-border p-2 w-12 bg-muted"></th>
                {Array.from({ length: COLS }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="border border-border p-2 min-w-[120px] bg-muted font-medium text-muted-foreground"
                  >
                    {getColumnName(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-border p-2 w-12 text-center bg-muted font-medium text-muted-foreground">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-border p-0"
                    >
                      <Input
                        type="text"
                        value={cell}
                        onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                        className="w-full h-full p-2 border-none rounded-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
