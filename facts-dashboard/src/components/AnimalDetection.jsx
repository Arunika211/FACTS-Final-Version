'use client';

import { useState, useRef, useEffect } from 'react';
import { detectAnimal, generateSampleDetection, constants } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function AnimalDetection() {
  // State untuk file gambar dan preview
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // State untuk model dan mode
  const [model, setModel] = useState(constants.DEFAULT_MODEL);
  const [isSimulation, setIsSimulation] = useState(false);
  
  // State untuk hasil deteksi
  const [resultImage, setResultImage] = useState(null);
  const [resultText, setResultText] = useState('');
  const [detections, setDetections] = useState([]);
  
  // State untuk loading dan error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref untuk file input
  const fileInputRef = useRef(null);
  
  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // Buat preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Reset hasil sebelumnya
    setResultImage(null);
    setResultText('');
    setDetections([]);
    setError(null);
  };
  
  // Handle deteksi
  const handleDetect = async () => {
    if (!file && !isSimulation) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (isSimulation) {
        // Mode simulasi
        result = generateSampleDetection(model);
      } else {
        // Mode API sebenarnya
        result = await detectAnimal(file, model);
      }
      
      // Set hasil
      if (result && result.length >= 3) {
        setResultImage(result[0] ? `data:image/jpeg;base64,${result[0]}` : null);
        setResultText(result[1] || '');
        setDetections(result[2] || []);
      } else {
        throw new Error('Format hasil tidak valid');
      }
    } catch (err) {
      console.error('Error in detection:', err);
      setError(err.message || 'Terjadi kesalahan saat deteksi');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultImage(null);
    setResultText('');
    setDetections([]);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup preview URL saat komponen unmount
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Deteksi Hewan Ternak</span>
          <div className="flex items-center space-x-2">
            <Label htmlFor="simulation-mode" className="text-sm font-normal">
              Mode Simulasi
            </Label>
            <Switch
              id="simulation-mode"
              checked={isSimulation}
              onCheckedChange={setIsSimulation}
            />
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">Pilih Model</Label>
              <Select 
                value={model} 
                onValueChange={setModel}
              >
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Pilih model" />
                </SelectTrigger>
                <SelectContent>
                  {constants.AVAILABLE_MODELS.map((modelName) => (
                    <SelectItem key={modelName} value={modelName}>
                      {modelName.charAt(0).toUpperCase() + modelName.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!isSimulation && (
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Gambar</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="cursor-pointer"
                  disabled={loading}
                />
              </div>
            )}
            
            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto object-contain max-h-[300px]"
                  />
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleDetect} 
                disabled={(!file && !isSimulation) || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Deteksi'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Results Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="image">Hasil Gambar</TabsTrigger>
                <TabsTrigger value="text">Hasil Teks</TabsTrigger>
                <TabsTrigger value="data">Data Deteksi</TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="min-h-[400px] flex items-center justify-center border rounded-md p-2">
                {resultImage ? (
                  <img 
                    src={resultImage} 
                    alt="Hasil Deteksi" 
                    className="max-w-full max-h-[350px] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    {loading ? "Memproses gambar..." : "Hasil deteksi akan ditampilkan di sini"}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="text" className="min-h-[400px]">
                {resultText ? (
                  <div className="bg-muted p-4 rounded-md h-full">
                    <pre className="whitespace-pre-wrap">{resultText}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    {loading ? "Memproses teks..." : "Hasil teks akan ditampilkan di sini"}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="data" className="min-h-[400px]">
                {detections && detections.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Terdeteksi {detections.length} objek:
                    </div>
                    
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {detections.map((det, idx) => (
                        <Card key={idx} className="p-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline">#{idx + 1}</Badge>{" "}
                              <Badge>{det.class}</Badge>
                            </div>
                            <Badge variant="secondary">
                              {(det.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            Bbox: [{det.bbox.map(n => n.toFixed(1)).join(", ")}]
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    {loading ? "Memproses data..." : "Data deteksi akan ditampilkan di sini"}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div>Model: {model}</div>
        <div>{isSimulation ? "Mode Simulasi" : "Mode API"}</div>
      </CardFooter>
    </Card>
  );
} 