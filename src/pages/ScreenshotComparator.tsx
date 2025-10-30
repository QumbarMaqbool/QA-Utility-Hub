import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import pixelmatch from "pixelmatch";

export default function ScreenshotComparator() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [diffImage, setDiffImage] = useState<string | null>(null);
  const [diffPercentage, setDiffPercentage] = useState<number | null>(null);
  
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (file: File, type: "before" | "after") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "before") {
        setBeforeImage(result);
      } else {
        setAfterImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const compareImages = async () => {
    if (!beforeImage || !afterImage) {
      toast.error("Please upload both images first");
      return;
    }

    const img1 = new Image();
    const img2 = new Image();

    img1.src = beforeImage;
    img2.src = afterImage;

    await Promise.all([
      new Promise((resolve) => (img1.onload = resolve)),
      new Promise((resolve) => (img2.onload = resolve)),
    ]);

    // Use the maximum dimensions
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    // Create canvases
    const canvas1 = beforeCanvasRef.current!;
    const canvas2 = afterCanvasRef.current!;
    const diffCanvas = diffCanvasRef.current!;

    canvas1.width = canvas2.width = diffCanvas.width = width;
    canvas1.height = canvas2.height = diffCanvas.height = height;

    const ctx1 = canvas1.getContext("2d")!;
    const ctx2 = canvas2.getContext("2d")!;
    const diffCtx = diffCanvas.getContext("2d")!;

    // Draw images
    ctx1.drawImage(img1, 0, 0, width, height);
    ctx2.drawImage(img2, 0, 0, width, height);

    // Get image data
    const img1Data = ctx1.getImageData(0, 0, width, height);
    const img2Data = ctx2.getImageData(0, 0, width, height);
    const diffData = diffCtx.createImageData(width, height);

    // Compare pixels
    const numDiffPixels = pixelmatch(
      img1Data.data,
      img2Data.data,
      diffData.data,
      width,
      height,
      { threshold: 0.1 }
    );

    // Draw diff
    diffCtx.putImageData(diffData, 0, 0);
    setDiffImage(diffCanvas.toDataURL());

    const totalPixels = width * height;
    const percentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);
    setDiffPercentage(parseFloat(percentage));

    toast.success(`Comparison complete! ${percentage}% difference detected`);
  };

  const downloadDiff = () => {
    if (!diffImage) {
      toast.error("No diff image to download. Compare images first!");
      return;
    }

    const a = document.createElement("a");
    a.href = diffImage;
    a.download = `screenshot-diff-${Date.now()}.png`;
    a.click();
    toast.success("Diff image downloaded!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Screenshot Comparator</h1>
        <p className="text-muted-foreground">
          Compare two screenshots and highlight visual differences with pixel-perfect accuracy
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>Choose before and after screenshots to compare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="before">Before (Original)</Label>
              <div className="relative">
                <Input
                  id="before"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "before");
                  }}
                  className="cursor-pointer"
                />
              </div>
              {beforeImage && (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <img src={beforeImage} alt="Before" className="w-full h-auto" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="after">After (Modified)</Label>
              <div className="relative">
                <Input
                  id="after"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "after");
                  }}
                  className="cursor-pointer"
                />
              </div>
              {afterImage && (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <img src={afterImage} alt="After" className="w-full h-auto" />
                </div>
              )}
            </div>
          </div>

          <Button onClick={compareImages} className="w-full" size="lg" disabled={!beforeImage || !afterImage}>
            <ImageIcon className="mr-2 h-5 w-5" />
            Compare Screenshots
          </Button>
        </CardContent>
      </Card>

      {diffImage && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comparison Result</CardTitle>
                <CardDescription>
                  {diffPercentage !== null && (
                    <span className="text-lg font-semibold text-primary">
                      {diffPercentage}% difference detected
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={downloadDiff}>
                <Download className="mr-2 h-4 w-4" />
                Download Diff
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              <img src={diffImage} alt="Difference" className="w-full h-auto" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Differences are highlighted in red. Areas in yellow/green show pixel variations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvases for processing */}
      <div className="hidden">
        <canvas ref={beforeCanvasRef} />
        <canvas ref={afterCanvasRef} />
        <canvas ref={diffCanvasRef} />
      </div>
    </div>
  );
}
