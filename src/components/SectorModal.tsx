import React, { useState, useRef } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const currentDateTime = new Date().toLocaleString('pt-BR');

  // Listas de opções para os dropdowns
  const dedetizadorOptions = [
    'João Silva',
    'Maria Santos',
    'Pedro Costa',
    'Ana Oliveira',
    'Carlos Ferreira',
    'Lucia Rodrigues',
    'Roberto Lima',
    'Fernanda Alves'
  ];

  const acompanhanteOptions = [
    'Dr. Paulo Mendes',
    'Enf. Carmen Torres',
    'Enf. Ricardo Gomes',
    'Dr. Julia Castro',
    'Enf. Marcos Pereira',
    'Dr. Sofia Barbosa',
    'Enf. Diego Nascimento',
    'Dr. Beatriz Rocha'
  ];

  const startCamera = async () => {
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta acesso à câmera.');
        return;
      }
      
      // Reset do estado de carregamento
      setIsVideoLoaded(false);
      setIsCameraActive(true);
      
      let mediaStream: MediaStream;
      
      // Tentar primeiro com câmera traseira, depois qualquer câmera disponível
      try {
        console.log('Tentando acessar câmera traseira...');
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
          } 
        });
        console.log('Câmera traseira ativada com sucesso');
      } catch (envError) {
        console.log('Câmera traseira não disponível, tentando qualquer câmera:', envError);
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 }
            }
          });
          console.log('Câmera frontal ativada com sucesso');
        } catch (frontError) {
          console.log('Tentando configuração básica de câmera:', frontError);
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Câmera básica ativada');
        }
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Limpar handlers anteriores
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onplaying = null;
        
        video.srcObject = mediaStream;
        
        // Aguardar o carregamento dos metadados
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsVideoLoaded(true);
          }
          video.play().catch(err => {
            console.error('Erro ao reproduzir vídeo:', err);
          });
        };
        
        // Handler para quando o vídeo pode ser reproduzido
        video.oncanplay = () => {
          console.log('Video can play');
          setIsVideoLoaded(true);
        };
        
        // Handler para quando o vídeo está realmente reproduzindo
        video.onplaying = () => {
          console.log('Video is playing');
          setIsVideoLoaded(true);
        };
        
        // Tentar reproduzir após um pequeno delay
        setTimeout(() => {
          video.play().catch(err => {
            console.error('Erro ao reproduzir vídeo (delayed):', err);
          });
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      let errorMessage = 'Erro ao acessar a câmera.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada. Por favor, permita o acesso à câmera.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Câmera está sendo usada por outro aplicativo.';
        }
      }
      
      alert(errorMessage);
      setIsCameraActive(false);
      setIsVideoLoaded(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsVideoLoaded(false);
  };

  const takePhoto = () => {
    // Verificar se já atingiu o limite de 5 fotos
    if (photos.length >= 5) {
      alert('Limite máximo de 5 fotos atingido.');
      return;
    }

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

    // Converter fotos para array de strings (dataURL)
    const photoUrls = photos.map(photo => photo.dataUrl);

    // Marcar setor como concluído com as fotos
    setorManager.completeSetor(sector.bloco, sector.pavimento, sector.setor, dedetizador, acompanhante, photoUrls);
    
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
                <Select value={dedetizador} onValueChange={setDedetizador}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o dedetizador" />
                  </SelectTrigger>
                  <SelectContent>
                    {dedetizadorOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="acompanhante">Acompanhante Responsável *</Label>
                <Select value={acompanhante} onValueChange={setAcompanhante}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o acompanhante" />
                  </SelectTrigger>
                  <SelectContent>
                    {acompanhanteOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <Button 
                      onClick={takePhoto} 
                      size="sm"
                      disabled={photos.length >= 5}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar {photos.length >= 5 ? '(Limite atingido)' : `(${photos.length}/5)`}
                    </Button>
                    <Button onClick={stopCamera} variant="outline" size="sm">
                      Fechar Câmera
                    </Button>
                  </div>
                )}
              </div>

              {/* Câmera */}
              {isCameraActive && (
                <div className="relative bg-gray-900 rounded-lg border p-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 rounded-lg"
                    style={{ 
                      minHeight: '200px',
                      maxWidth: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000'
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                      alert('Erro no elemento de vídeo');
                    }}
                    onPlaying={() => {
                      console.log('Video is playing');
                      setIsVideoLoaded(true);
                    }}
                  />
                  {/* Indicador de carregamento */}
                  {!isVideoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black bg-opacity-75 rounded-lg">
                      <div className="text-center">
                        <div className="animate-pulse mb-2">📷</div>
                        <div>Carregando câmera...</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info */}
                  {isVideoLoaded && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Câmera ativa
                    </div>
                  )}
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