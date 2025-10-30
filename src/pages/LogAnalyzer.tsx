import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Minus, Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LogAnalysis {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  failedTests: string[];
  errorMessages: string[];
  stackTraces: string[];
  framework: string;
}

interface AIInsights {
  insights: string;
}

export default function LogAnalyzer() {
  const [logInput, setLogInput] = useState("");
  const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFramework = (content: string): string => {
    const lower = content.toLowerCase();
    
    // Framework detection patterns
    if (lower.includes('playwright') || lower.includes('@playwright/test')) return 'Playwright';
    if (lower.includes('cypress') || lower.includes('cy.')) return 'Cypress';
    if (lower.includes('selenium') || lower.includes('webdriver')) return 'Selenium';
    if (lower.includes('jest') || lower.includes('● ')) return 'Jest';
    if (lower.includes('mocha') || lower.includes('describe(')) return 'Mocha';
    if (lower.includes('pytest') || lower.includes('test session starts')) return 'Pytest';
    if (lower.includes('junit') || lower.includes('<testsuite')) return 'JUnit';
    if (lower.includes('testng')) return 'TestNG';
    if (lower.includes('rspec') || lower.includes('finished in')) return 'RSpec';
    if (lower.includes('postman') || lower.includes('newman')) return 'Postman/Newman';
    if (lower.includes('error:') && lower.includes('at ') && lower.includes('.js:')) return 'Node.js';
    if (lower.includes('traceback') && lower.includes('file "')) return 'Python';
    if (lower.includes('exception in thread') || lower.includes('at java.')) return 'Java';
    
    return 'Unknown';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.txt', '.log', '.json'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Invalid file type. Please upload ${validExtensions.join(', ')} files.`);
      return;
    }

    try {
      const text = await file.text();
      setLogInput(text);
      toast.success(`Loaded ${file.name}`);
    } catch (error) {
      toast.error("Failed to read file");
      console.error(error);
    }
  };

  const analyzeLog = async () => {
    if (!logInput.trim()) {
      toast.error("Please paste log content first");
      return;
    }

    setIsAnalyzing(true);
    const lines = logInput.split("\n");
    const framework = detectFramework(logInput);
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const failedTests: string[] = [];
    const errorMessages: string[] = [];
    const stackTraces: string[] = [];

    // Enhanced pattern matching for multiple frameworks
    lines.forEach((line, index) => {
      // Pass patterns
      if (/PASS|✓|passed|success|\[PASS\]|OK|PASSED/i.test(line)) {
        passed++;
      }
      
      // Fail patterns
      if (/FAIL|✗|failed|error|\[FAIL\]|\[ERROR\]|FAILED|AssertionError|Exception/i.test(line)) {
        failed++;
        
        // Extract test name with enhanced patterns
        const testMatch = line.match(/(?:test|it|describe|def test_|Test)[\s:]+["']?([^"'\n]+)["']?/i) ||
                         line.match(/●\s+(.+)/) ||
                         line.match(/FAILED\s+(.+?)(?:\s+-|\s+\[|$)/i);
        
        if (testMatch) {
          failedTests.push(testMatch[1].trim());
        } else if (line.trim()) {
          failedTests.push(line.trim().substring(0, 100));
        }
      }
      
      // Skip patterns
      if (/SKIP|⊘|skipped|pending|\[SKIP\]|SKIPPED/i.test(line)) {
        skipped++;
      }

      // Extract error messages with context
      if (/error:|exception:|assertion|traceback|at\s+/i.test(line.toLowerCase())) {
        errorMessages.push(line.trim());
        
        // Try to capture stack trace (next 3-5 lines)
        if (index < lines.length - 1) {
          const stackLines: string[] = [line];
          for (let i = 1; i <= 5 && index + i < lines.length; i++) {
            const nextLine = lines[index + i].trim();
            if (nextLine && (nextLine.startsWith('at ') || nextLine.includes('File "') || nextLine.match(/^\d+\s+\|/))) {
              stackLines.push(nextLine);
            } else if (nextLine) {
              break;
            }
          }
          if (stackLines.length > 1) {
            stackTraces.push(stackLines.join('\n'));
          }
        }
      }
    });

    const totalTests = passed + failed + skipped;

    setAnalysis({
      totalTests: totalTests || lines.filter(l => l.trim()).length,
      passed,
      failed,
      skipped,
      failedTests: [...new Set(failedTests)].slice(0, 20),
      errorMessages: [...new Set(errorMessages)].slice(0, 10),
      stackTraces: [...new Set(stackTraces)].slice(0, 5),
      framework,
    });

    setIsAnalyzing(false);
    toast.success("Log analysis complete!");
    
    // Auto-trigger AI insights if there are failures
    if (failed > 0) {
      await getAIInsights(logInput, framework);
    }
  };

  const getAIInsights = async (content?: string, detectedFramework?: string) => {
    const logContent = content || logInput;
    const framework = detectedFramework || analysis?.framework || 'Unknown';
    
    if (!logContent.trim()) {
      toast.error("No log content to analyze");
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-log', {
        body: { 
          logContent,
          detectedFramework: framework 
        }
      });

      if (error) throw error;

      if (data?.insights) {
        setAiInsights(data.insights);
        toast.success("AI insights generated!");
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate AI insights");
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) {
      toast.error("No analysis to download. Analyze logs first!");
      return;
    }

    const report = `
Test Log Analysis Report
========================
Generated: ${new Date().toLocaleString()}
Framework Detected: ${analysis.framework}

Summary:
--------
Total Tests: ${analysis.totalTests}
Passed: ${analysis.passed}
Failed: ${analysis.failed}
Skipped: ${analysis.skipped}
Pass Rate: ${analysis.totalTests > 0 ? ((analysis.passed / analysis.totalTests) * 100).toFixed(2) : 0}%

Failed Tests:
-------------
${analysis.failedTests.length > 0 ? analysis.failedTests.map((test, i) => `${i + 1}. ${test}`).join('\n') : 'None'}

Error Messages:
---------------
${analysis.errorMessages.length > 0 ? analysis.errorMessages.map((err, i) => `${i + 1}. ${err}`).join('\n') : 'None'}

Stack Traces:
-------------
${analysis.stackTraces.length > 0 ? analysis.stackTraces.map((trace, i) => `${i + 1}.\n${trace}`).join('\n\n') : 'None'}

AI Insights:
------------
${aiInsights || 'No AI insights generated'}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-analysis-${Date.now()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const passRate = analysis && analysis.totalTests > 0
    ? ((analysis.passed / analysis.totalTests) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Log Analyzer</h1>
        <p className="text-muted-foreground">
          AI-powered analysis for test logs from any framework - Playwright, Cypress, Selenium, Jest, Mocha, and more
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Log Input</CardTitle>
          <CardDescription>
            Upload or paste test logs from any framework (.txt, .json, .log files supported)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.log,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              or paste content below
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-input">Test Log Content</Label>
            <Textarea
              id="log-input"
              placeholder="PASS  src/components/Button.test.tsx
FAIL  src/components/Input.test.tsx
  ✓ should render correctly (25ms)
  ✗ should handle errors (12ms)

Or upload a log file (.txt, .json, .log)"
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              className="min-h-[250px] font-mono text-sm"
            />
          </div>

          <Button 
            onClick={analyzeLog} 
            className="w-full" 
            size="lg"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Logs'
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-sm">
              Detected Framework: {analysis.framework}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analysis.totalTests}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{analysis.passed}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{analysis.failed}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 border-yellow-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Minus className="h-4 w-4 text-yellow-500" />
                  Pass Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{passRate}%</div>
              </CardContent>
            </Card>
          </div>

          {analysis.failedTests.length > 0 && (
            <Card className="bg-gradient-card border-border/50 border-red-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Failed Tests</CardTitle>
                    <CardDescription>{analysis.failedTests.length} test(s) failed</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.failedTests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <Badge variant="destructive" className="shrink-0 mt-0.5">
                        {index + 1}
                      </Badge>
                      <code className="text-sm flex-1 break-all">{test}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.errorMessages.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Error Messages</CardTitle>
                <CardDescription>{analysis.errorMessages.length} error(s) detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.errorMessages.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <code className="text-xs text-muted-foreground break-all">{error}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.stackTraces.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Stack Traces</CardTitle>
                <CardDescription>{analysis.stackTraces.length} stack trace(s) captured</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.stackTraces.map((trace, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <code className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                        {trace}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {aiInsights && (
            <Card className="bg-gradient-card border-border/50 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>🧠 AI Insights & Fix Suggestions</CardTitle>
                </div>
                <CardDescription>
                  Powered by AI - Root cause analysis and recommended fixes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm">{aiInsights}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.failed > 0 && !aiInsights && (
            <Card className="bg-gradient-card border-border/50 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>🧠 AI Insights</CardTitle>
                  </div>
                  <Button 
                    onClick={() => getAIInsights()}
                    disabled={isLoadingAI}
                    variant="outline"
                    size="sm"
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Insights
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  Get AI-powered root cause analysis and fix suggestions
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
