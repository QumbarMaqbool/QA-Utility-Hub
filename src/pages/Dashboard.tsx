import { Link } from "react-router-dom";
import { Code, Database, FileJson, Camera, Bug, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    title: "XPath & CSS Selector Generator",
    description: "Generate stable XPath and CSS selectors from HTML snippets instantly",
    icon: Code,
    href: "/xpath",
    color: "text-blue-500",
  },
  {
    title: "Test Data Generator",
    description: "Create realistic dummy data for testing forms, APIs, and more",
    icon: Database,
    href: "/test-data",
    color: "text-green-500",
  },
  {
    title: "JSON Formatter",
    description: "Validate, beautify, and convert between JSON and CSV formats",
    icon: FileJson,
    href: "/json-formatter",
    color: "text-yellow-500",
  },
  {
    title: "Screenshot Comparator",
    description: "Compare two screenshots and highlight visual differences",
    icon: Camera,
    href: "/screenshot",
    color: "text-purple-500",
  },
  {
    title: "Test Log Analyzer",
    description: "Quickly extract test results and failed cases from logs",
    icon: Bug,
    href: "/log-analyzer",
    color: "text-red-500",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-primary p-8 text-white shadow-elegant">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome to QA Utility Hub</h1>
          <p className="text-lg text-white/90 mb-6">
            Your complete toolkit for QA testing and automation. All tools are free, fast, and work directly in your browser.
          </p>
          <div className="flex gap-4">
            <Button asChild variant="secondary" size="lg">
              <Link to="/xpath">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} to={tool.href}>
            <Card className="h-full transition-all hover:shadow-elegant hover:-translate-y-1 bg-gradient-card border-border/50">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
                <CardDescription className="text-base">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group">
                  Open Tool
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Features */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Why QA Utility Hub?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-2">🚀 Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                All tools run directly in your browser. No server delays, no waiting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔒 Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Your data never leaves your device. Everything is processed locally.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💰 Always Free</h3>
              <p className="text-sm text-muted-foreground">
                No subscriptions, no hidden costs. Built by QA engineers, for QA engineers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
