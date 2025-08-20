import React, { useState, useRef } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SetorManager, type SectorData } from '../lib/hospitalData';

interface SectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: SectorData | null;
  setorManager: SetorManager;
  onUpdate: () => void;
}

interface SectorPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const SectorModal: React.FC<SectorModalProps> = ({
  isOpen,
  onClose,
  sector,
  setorManager,
  onUpdate
}) => {
  const [dedetizador, setDedetizador] = useState('');
  const [acompanhante, setAcompanhante] = useState('');
  const [photos, setPhotos] = useState<SectorPhoto[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const currentDateTime = new Date().toLocaleString('pt-BR');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        const newPhoto: SectorPhoto = {
          id: Date.now().toString(),
          dataUrl,
          timestamp: new Date()
        };
        
        setPhotos(prev => [...prev, newPhoto]);
      }
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleConcluir = () => {
    if (!sector || !dedetizador || !acompanhante) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Salvar as fotos no localStorage associadas ao setor
    const sectorKey = `${sector.bloco}-${sector.pavimento}-${sector.setor}`;
    const sectorPhotos = {
      photos,
      dedetizador,
      acompanhante,
      timestamp: new Date()
    };
    
    localStorage.setItem(`sector-photos-${sectorKey}`, JSON.stringify(sectorPhotos));

    // Marcar setor como concluído
    setorManager.completeSetor(sector.bloco, sector.pavimento, sector.setor, dedetizador, acompanhante);
    
    onUpdate();
    stopCamera();
    onClose();
    
    // Reset form
    setDedetizador('');
    setAcompanhante('');
    setPhotos([]);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!sector) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Dedetização - {sector.setor}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {sector.bloco} - {sector.pavimento}
            </p>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dedetizador">Dedetizador do Dia *</Label>
                <Input
                  id="dedetizador"
                  value={dedetizador}
                  onChange={(e) => setDedetizador(e.target.value)}
                  placeholder="Nome do dedetizador"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="acompanhante">Acompanhante Responsável *</Label>
                <Input
                  id="acompanhante"
                  value={acompanhante}
                  onChange={(e) => setAcompanhante(e.target.value)}
                  placeholder="Nome do acompanhante"
                  className="w-full"
                />
              </div>
            </div>

            {/* Data e hora automáticas */}
            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {currentDateTime}
              </div>
            </div>

            {/* Seção de fotos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Fotos do Serviço</Label>
                {!isCameraActive ? (
                  <Button onClick={startCamera} variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Abrir Câmera
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={takePhoto} size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar
                    </Button>
                    <Button onClick={stopCamera} variant="outline" size="sm">
                      Fechar Câmera
                    </Button>
                  </div>
                )}
              </div>

              {/* Câmera */}
              {isCameraActive && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg border"
                  />
                </div>
              )}

              {/* Canvas oculto para captura */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Galeria de fotos */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fotos Capturadas ({photos.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.dataUrl}
                          alt="Foto do serviço"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {photo.timestamp.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão Concluído */}
            <Button 
              onClick={handleConcluir} 
              className="w-full"
              size="lg"
              disabled={!dedetizador || !acompanhante}
            >
              <Check className="w-5 h-5 mr-2" />
              Concluído
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SectorModal;