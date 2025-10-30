import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateJson = () => {
    if (!input.trim()) {
      toast.error("Please enter JSON to validate");
      return;
    }

    try {
      JSON.parse(input);
      setIsValid(true);
      toast.success("JSON is valid!");
    } catch (error) {
      setIsValid(false);
      toast.error("Invalid JSON! Check syntax and try again.");
    }
  };

  const beautifyJson = () => {
    if (!input.trim()) {
      toast.error("Please enter JSON to beautify");
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const beautified = JSON.stringify(parsed, null, 2);
      setOutput(beautified);
      setIsValid(true);
      toast.success("JSON beautified!");
    } catch (error) {
      setIsValid(false);
      toast.error("Invalid JSON! Cannot beautify.");
    }
  };

  const jsonToCsv = () => {
    if (!input.trim()) {
      toast.error("Please enter JSON to convert");
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const arrayData = Array.isArray(parsed) ? parsed : [parsed];
      const csv = Papa.unparse(arrayData);
      setOutput(csv);
      toast.success("Converted JSON to CSV!");
    } catch (error) {
      toast.error("Failed to convert. Ensure JSON is valid and represents tabular data.");
    }
  };

  const csvToJson = () => {
    if (!input.trim()) {
      toast.error("Please enter CSV to convert");
      return;
    }

    try {
      const result = Papa.parse(input, { header: true });
      const json = JSON.stringify(result.data, null, 2);
      setOutput(json);
      toast.success("Converted CSV to JSON!");
    } catch (error) {
      toast.error("Failed to parse CSV. Check format and try again.");
    }
  };

  const copyOutput = () => {
    if (!output) {
      toast.error("No output to copy");
      return;
    }
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">JSON & CSV Formatter</h1>
        <p className="text-muted-foreground">
          Validate, beautify, and convert between JSON and CSV formats
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Input
              {isValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isValid === false && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>Paste your JSON or CSV data here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Input Data</Label>
              <Textarea
                id="input"
                placeholder='{"name": "John", "age": 30} or CSV data...'
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsValid(null);
                }}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={validateJson} variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Validate
              </Button>
              <Button onClick={beautifyJson} variant="outline">
                Beautify
              </Button>
              <Button onClick={jsonToCsv} variant="outline">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                JSON → CSV
              </Button>
              <Button onClick={csvToJson} variant="outline">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                CSV → JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Output</CardTitle>
                <CardDescription>Formatted result appears here</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="sm" onClick={copyOutput}>
                  Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              placeholder="Output will appear here after processing..."
              className="min-h-[300px] font-mono text-sm bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• For JSON → CSV: Use an array of objects for best results</li>
            <li>• For CSV → JSON: First row should contain column headers</li>
            <li>• Validate checks if JSON syntax is correct</li>
            <li>• Beautify formats JSON with proper indentation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
