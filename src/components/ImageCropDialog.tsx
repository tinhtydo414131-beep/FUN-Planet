import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
}

export const ImageCropDialog = ({ open, imageUrl, onCropComplete, onClose }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropAreaChange = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const image = await createImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx || !croppedAreaPixels) return;

      // Set canvas size to cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Resize to max 512x512 while maintaining aspect ratio
      const maxSize = 512;
      let targetWidth = canvas.width;
      let targetHeight = canvas.height;

      if (targetWidth > maxSize || targetHeight > maxSize) {
        if (targetWidth > targetHeight) {
          targetHeight = (targetHeight / targetWidth) * maxSize;
          targetWidth = maxSize;
        } else {
          targetWidth = (targetWidth / targetHeight) * maxSize;
          targetHeight = maxSize;
        }
      }

      // Create final resized canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) return;

      finalCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

      // Convert to blob
      finalCanvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-fredoka text-primary">
            Chỉnh sửa ảnh đại diện 🖼️
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Crop Area */}
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaChange}
            />
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-comic text-muted-foreground">
              <span className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" />
                Thu nhỏ
              </span>
              <span className="flex items-center gap-2">
                Phóng to
                <ZoomIn className="w-4 h-4" />
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <p className="text-xs text-center text-muted-foreground font-comic">
            💡 Kéo để di chuyển, dùng thanh trượt để phóng to/thu nhỏ
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="font-fredoka"
          >
            Hủy
          </Button>
          <Button
            onClick={createCroppedImage}
            className="font-fredoka font-bold bg-gradient-to-r from-primary to-secondary"
          >
            Xong ✓
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
