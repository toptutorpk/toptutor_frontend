import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const VIEWPORT = 288; // crop square (the circle is inscribed) shown in the editor
const OUTPUT = 512; // exported avatar size in px
const MAX_ZOOM = 4;

interface Props {
  open: boolean;
  /** Object URL of the image being cropped. */
  imageSrc: string | null;
  saving?: boolean;
  /** Dialog heading — names the thing being cropped ("Adjust your photo", "Adjust your logo"). */
  title?: string;
  /** Confirm-button text, for the same reason. */
  saveLabel?: string;
  onCancel: () => void;
  /** Receives the cropped 512×512 JPEG. */
  onSave: (blob: Blob) => void;
}

/**
 * WhatsApp/LinkedIn-style avatar cropper: drag to reposition, wheel/slider to zoom, circular preview.
 * Produces a square {@link OUTPUT}px JPEG of the visible crop — only that is uploaded, never the original.
 */
export function ImageCropDialog({
  open,
  imageSrc,
  saving,
  title = 'Adjust your photo',
  saveLabel = 'Save photo',
  onCancel,
  onSave,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const nat = useRef({ w: 0, h: 0, base: 1 }); // natural size + cover base-scale
  const zoomRef = useRef(1);
  const offset = useRef({ x: 0, y: 0 }); // image-centre offset from viewport centre, in px
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [zoomUi, setZoomUi] = useState(1);
  const [ready, setReady] = useState(false);

  // Effective (scaled) image size at the current zoom.
  const size = () => ({
    w: nat.current.w * nat.current.base * zoomRef.current,
    h: nat.current.h * nat.current.base * zoomRef.current,
  });

  // Re-clamp the offset so the image always covers the crop square, then write the transform.
  const apply = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const { w, h } = size();
    const maxX = Math.max(0, (w - VIEWPORT) / 2);
    const maxY = Math.max(0, (h - VIEWPORT) / 2);
    offset.current.x = Math.min(maxX, Math.max(-maxX, offset.current.x));
    offset.current.y = Math.min(maxY, Math.max(-maxY, offset.current.y));
    const left = VIEWPORT / 2 + offset.current.x - w / 2;
    const top = VIEWPORT / 2 + offset.current.y - h / 2;
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    img.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, []);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    nat.current = {
      w: img.naturalWidth,
      h: img.naturalHeight,
      base: Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight),
    };
    zoomRef.current = 1;
    offset.current = { x: 0, y: 0 };
    setZoomUi(1);
    setReady(true);
    apply();
  };

  const setZoom = (z: number) => {
    zoomRef.current = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoomUi(zoomRef.current);
    apply();
  };

  // Reset when a new image is opened.
  useEffect(() => {
    if (open) setReady(false);
  }, [open, imageSrc]);

  // ---- drag ----
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.current.x, oy: offset.current.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    offset.current.x = drag.current.ox + (e.clientX - drag.current.px);
    offset.current.y = drag.current.oy + (e.clientY - drag.current.py);
    apply();
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.9));
  };

  const save = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff'; // opaque backing for any transparency
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const { w, h } = size();
    const k = OUTPUT / VIEWPORT;
    const left = VIEWPORT / 2 + offset.current.x - w / 2;
    const top = VIEWPORT / 2 + offset.current.y - h / 2;
    ctx.drawImage(img, left * k, top * k, w * k, h * k);
    canvas.toBlob((blob) => blob && onSave(blob), 'image/jpeg', 0.9);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none overflow-hidden rounded-xl bg-neutral-900 select-none"
            style={{ width: VIEWPORT, height: VIEWPORT, cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                // Names the image for a screen reader. It was previously unlabelled behind a
                // disable comment for a rule this project does not have installed, so the comment
                // was itself the only thing the linter reported.
                alt="The image you are cropping"
                onLoad={onImgLoad}
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
                style={{ opacity: ready ? 1 : 0 }}
              />
            )}
            {/* Circular mask: dims everything outside the inscribed circle + a white ring. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: `inset 0 0 0 2px rgba(255,255,255,.9)`, borderRadius: '50%' }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: VIEWPORT, height: VIEWPORT, boxShadow: '0 0 0 9999px rgba(0,0,0,.45)' }}
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              </div>
            )}
          </div>

          <div className="flex w-full items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[zoomUi]}
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              onValueChange={([v]) => setZoom(v)}
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Drag to reposition · scroll or use the slider to zoom</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={save} disabled={saving || !ready}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
