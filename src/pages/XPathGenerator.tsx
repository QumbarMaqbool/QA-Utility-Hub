import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Selectors = {
  xpath: string[];
  css: string[];
  testIds: string[];
};

// --- NEW HELPER ---
// Generates a stable, indexed XPath for a given element
// e.g., /html/body/div[1]/section[2]/button[1]
function getXPathTo(element: Element): string {
  // Prefer an ID-based XPath if the element has one
  if (element.id) {
    // NOTE: Using //*[@id='...'] is not a *full* path, but it's more stable.
    // Let's create the full path *with* an ID check if possible.
    // For this tool, a simple //*[@id] is good.
    return `//*[@id='${element.id}']`;
  }

  // Handle base cases
  if (element.tagName.toLowerCase() === 'html') {
    return '/html';
  }
  if (element === document.body) {
    return '/html/body';
  }
  if (!element.parentElement) {
    return `/${element.tagName.toLowerCase()}`;
  }

  let ix = 0;
  const siblings = element.parentElement.children;

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    // If it's the element we're looking for, construct the path
    if (sibling === element) {
      return `${getXPathTo(element.parentElement)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    // Increment index only for elements with the same tag
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
  // Fallback (should be unreachable)
  return `/${element.tagName.toLowerCase()}`;
}


// --- FIXED HELPER ---
// Now handles all quote scenarios for XPath text/attribute matching
function escapeXpathText(s: string) {
  // create an xpath literal that handles both quotes
  if (s.indexOf("'") === -1) return `'${s}'`;
  if (s.indexOf('"') === -1) return `"${s}"`;
  // contains approach if both quotes present
  return `concat('${s.replace(/'/g, "',\"'\",'")}')`;
}

// --- NEW HELPER ---
// Correctly escapes a value for use in a CSS attribute selector
function escapeCssAttr(val: string) {
  // Escape backslashes and double quotes
  const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}


// Define stable attributes *outside* the function
const STABLE_ATTRIBUTES = ["name", "placeholder", "type", "role", "aria-label", "alt", "href", "src"];
const TEST_ID_ATTRIBUTES = ["data-testid", "data-cy", "data-qa", "data-test"];

export default function XPathGenerator() {
  const [html, setHtml] = useState("");
  const [selectors, setSelectors] = useState<Selectors | null>(null);

  const generateSelectors = () => {
    if (!html.trim()) {
      toast.error("Please enter some HTML first");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const elements = doc.querySelectorAll("*");

      const xpaths: string[] = [];
      const cssSelectors: string[] = [];
      const dataTestIdSelectors: string[] = []; // --- FIX: Renamed for clarity

      elements.forEach((el, index) => {
        // --- FIX: Increased limit for more complex snippets
        if (index >= 100) return; 

        const tag = el.tagName.toLowerCase();
        
        // Skip document structure tags
        if (["html", "head", "body", "script", "style", "meta", "title"].includes(tag)) {
            return;
        }

        const id = el.getAttribute("id");
        const text = (el.textContent || "").trim().replace(/\s+/g, " ");

        // --- 1️⃣ Priority: Data-TestId (Best) ---
        // --- FIX: Logic now *finds* test IDs, not suggests them
        for (const attr of TEST_ID_ATTRIBUTES) {
          const value = el.getAttribute(attr);
          if (value) {
            const escapedXPathVal = escapeXpathText(value);
            const escapedCssVal = escapeCssAttr(value);
            const selector = `${tag}[${attr}=${escapedCssVal}]`;
            
            xpaths.push(`//${tag}[@${attr}=${escapedXPathVal}]`);
            cssSelectors.push(selector);
            dataTestIdSelectors.push(selector);
          }
        }

        // --- 2️⃣ ID based selectors (Great) ---
        if (id) {
          // --- FIX: Use CSS.escape for robustness
          xpaths.push(`//${tag}[@id=${escapeXpathText(id)}]`);
          cssSelectors.push(`${tag}#${CSS.escape(id)}`);
        }
        
        // --- 3️⃣ Label relationship (Good for forms) ---
        if (["input", "textarea", "select"].includes(tag)) {
          // --- NEW: Check for <label for="...">
          if (id) {
            const linkedLabel = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
            if (linkedLabel && linkedLabel.textContent?.trim()) {
              const labelText = linkedLabel.textContent.trim().replace(/\s+/g, " ");
              xpaths.push(`//${tag}[@id=//label[normalize-space(text())=${escapeXpathText(labelText)}]/@for]`);
            }
          }

          // Parent label
          const parentLabel = el.closest("label");
          if (parentLabel && parentLabel.textContent?.trim()) {
            const labelText = parentLabel.textContent.trim().replace(/\s+/g, " ");
            // --- FIX: Use escaping function
            xpaths.push(`//label[normalize-space(text())=${escapeXpathText(labelText)}]//${tag}`);
            cssSelectors.push(`label:has(${tag})`); // :has() is modern but standard
          }

          // Sibling label (less common, but possible)
          const siblingLabel = el.parentElement?.querySelector("label");
          if (siblingLabel && siblingLabel.textContent?.trim() && siblingLabel.nextElementSibling === el) {
            const labelText = siblingLabel.textContent.trim().replace(/\s+/g, " ");
            // --- FIX: Use escaping function
            xpaths.push(`//label[normalize-space(text())=${escapeXpathText(labelText)}]/following-sibling::${tag}`);
          }
        }

        // --- 4️⃣ Text-based selectors (Good for buttons, links, etc.) ---
        // --- FIX: Only match on "leaf" nodes (no element children)
        if (["button", "a", "div", "span", "h1", "h2", "h3", "p", "legend"].includes(tag) && text && text.length < 50 && el.firstElementChild === null) {
          const escapedText = escapeXpathText(text);
          // --- FIX: Add *both* exact match and contains match
          xpaths.push(`//${tag}[normalize-space(text())=${escapedText}]`);
          xpaths.push(`//${tag}[contains(normalize-space(text()), ${escapedText})]`);
        }

        // --- 5️⃣ Stable Attribute-based selectors (Good) ---
        STABLE_ATTRIBUTES.forEach(attr => {
          const value = el.getAttribute(attr);
          if (value) {
            // --- FIX: Use escaping functions
            xpaths.push(`//${tag}[@${attr}=${escapeXpathText(value)}]`);
            cssSelectors.push(`${tag}[${attr}=${escapeCssAttr(value)}]`);
          }
        });

        // --- 6️⃣ Absolute XPath (Last Resort) ---
        // --- NEW: Generate a full, indexed XPath as a fallback
        if (["input", "button", "a", "select", "textarea"].includes(tag)) {
          try {
            xpaths.push(getXPathTo(el));
          } catch(e) {
            // ignore errors from getXPathTo if DOM is weird
          }
        }

        // --- ❌ REMOVED: Class-based selectors ---
        // This strategy is too brittle with modern frameworks.
      });

      setSelectors({
        xpath: Array.from(new Set(xpaths)),
        css: Array.from(new Set(cssSelectors)),
        // --- FIX: Update state and fallback message
        testIds: Array.from(new Set(dataTestIdSelectors.length ? dataTestIdSelectors : ["No data-test* attributes found"])),
      });

      toast.success("Advanced selectors generated successfully!");
    } catch (error) {
      console.error("Selector generation failed:", error);
      toast.error("Failed to analyze HTML. Please check your input.");
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">XPath & CSS Selector Generator</h1>
        <p className="text-muted-foreground">
          Paste your HTML snippet and get stable XPath, CSS selectors, and test ID suggestions
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>HTML Input</CardTitle>
          <CardDescription>
            Pro tip: Works best with properly formatted HTML
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="html-input">Paste your HTML here</Label>
            <Textarea
              id="html-input"
              placeholder='<div class="user-profile">
  <h1 id="username">John Doe</h1>
  <button class="btn-primary">Edit Profile</button>
</div>'
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <Button onClick={generateSelectors} className="w-full" size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Selectors
          </Button>
        </CardContent>
      </Card>

      {selectors && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">XPath Selectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectors.xpath.map((xpath, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="flex-1 text-sm font-mono break-all">{xpath}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => copyToClipboard(xpath)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">CSS Selectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectors.css.map((css, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="flex-1 text-sm font-mono break-all">{css}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => copyToClipboard(css)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* --- FIX: Updated title to be accurate --- */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Data-TestId Selectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectors.testIds.map((testId, index) => (
                <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <code className="flex-1 text-sm font-mono break-all">{testId}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => copyToClipboard(testId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}