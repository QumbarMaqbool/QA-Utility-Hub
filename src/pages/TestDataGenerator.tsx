import { useState } from "react";
import { faker } from "@faker-js/faker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

type DataType = "name" | "email" | "phone" | "address" | "string" | "uuid" | "date" | "number";

interface GeneratedRow {
  [key: string]: string | number;
}

export default function TestDataGenerator() {
  const [dataType, setDataType] = useState<DataType>("name");
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<GeneratedRow[]>([]);

  const generateData = () => {
    if (isNaN(rowCount) || rowCount < 1 || rowCount > 500) {
      toast.error("Please enter a number between 1 and 500");
      return;
    }

    const data: GeneratedRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      let row: GeneratedRow = { id: i + 1 };

      switch (dataType) {
        case "name":
          row.firstName = faker.person.firstName();
          row.lastName = faker.person.lastName();
          row.fullName = faker.person.fullName();
          break;
        case "email":
          row.email = faker.internet.email();
          row.username = faker.internet.username();
          break;
        case "phone":
          row.phone = faker.phone.number();
          row.countryCode = faker.location.countryCode();
          break;
        case "address":
          row.street = faker.location.streetAddress();
          row.city = faker.location.city();
          row.state = faker.location.state();
          row.zipCode = faker.location.zipCode();
          row.country = faker.location.country();
          break;
        case "string":
          row.randomString = faker.string.alphanumeric(10);
          row.word = faker.word.sample();
          break;
        case "uuid":
          row.uuid = faker.string.uuid();
          break;
        case "date":
          row.pastDate = faker.date.past().toISOString().split("T")[0];
          row.futureDate = faker.date.future().toISOString().split("T")[0];
          row.recentDate = faker.date.recent().toISOString().split("T")[0];
          break;
        case "number":
          row.integer = faker.number.int({ min: 1, max: 1000 });
          row.float = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
          break;
      }

      data.push(row);
    }

    setGeneratedData(data);
    toast.success(`Generated ${rowCount} rows of test data!`);
  };

  const downloadCSV = () => {
    if (generatedData.length === 0) {
      toast.error("No data to download. Generate data first!");
      return;
    }

    const csv = Papa.unparse(generatedData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-data-${dataType}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV file downloaded!");
  };

  const copyData = () => {
    if (generatedData.length === 0) {
      toast.error("No data to copy. Generate data first!");
      return;
    }

    const csv = Papa.unparse(generatedData);
    navigator.clipboard.writeText(csv);
    toast.success("Data copied to clipboard!");
  };

  const columns = generatedData.length > 0 ? Object.keys(generatedData[0]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Data Generator</h1>
        <p className="text-muted-foreground">
          Create realistic dummy data for testing forms, APIs, and applications
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Choose what type of data to generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select value={dataType} onValueChange={(value) => setDataType(value as DataType)}>
                <SelectTrigger id="data-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Names</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="phone">Phone Numbers</SelectItem>
                  <SelectItem value="address">Addresses</SelectItem>
                  <SelectItem value="string">Random Strings</SelectItem>
                  <SelectItem value="uuid">UUIDs</SelectItem>
                  {/* --- THIS IS THE FIX --- */}
                  <SelectItem value="date">Dates</SelectItem>
                  <SelectItem value="number">Numbers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="row-count">Number of Rows (1-500)</Label>
              <Input
                id="row-count"
                type="number"
                min={1}
                max={500}
                value={rowCount}
                onChange={(e) => setRowCount(e.target.valueAsNumber)}
              />
            </div>
          </div>

          <Button onClick={generateData} className="w-full" size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Test Data
          </Button>
        </CardContent>
      </Card>

      {generatedData.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Data</CardTitle>
                <CardDescription>{generatedData.length} rows generated</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyData}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="font-semibold">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedData.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column} className="font-mono text-sm">
                          {row[column]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}