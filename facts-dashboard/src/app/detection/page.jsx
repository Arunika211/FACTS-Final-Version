import AnimalDetection from "@/components/AnimalDetection";

export const metadata = {
  title: 'Deteksi Hewan - FACTS',
  description: 'Deteksi hewan ternak dengan model YOLO',
};

export default function DetectionPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Deteksi Hewan</h1>
        <p className="text-muted-foreground">
          Deteksi hewan ternak menggunakan model YOLOv5. Upload gambar atau gunakan mode simulasi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimalDetection />
      </div>
    </div>
  );
} 