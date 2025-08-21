import React from 'react';
import { X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  sectorInfo: {
    bloco: string;
    pavimento: string;
    setor: string;
  };
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  images,
  sectorInfo
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${sectorInfo.bloco}-${sectorInfo.setor}-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    images.forEach((imageUrl, index) => {
      setTimeout(() => {
        downloadImage(imageUrl, index);
      }, index * 100);
    });
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Imagens do Setor: {sectorInfo.bloco} - {sectorInfo.setor}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAllImages}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Todas
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentImageIndex + 1} de {images.length}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          {/* Image Display */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg mb-4">
            <img
              src={images[currentImageIndex]}
              alt={`Imagem ${currentImageIndex + 1} do setor ${sectorInfo.setor}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Image Navigation */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentImageIndex === 0}
                onClick={() => setCurrentImageIndex(prev => prev - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentImageIndex === images.length - 1}
                onClick={() => setCurrentImageIndex(prev => prev + 1)}
              >
                Próxima
              </Button>
            </div>
          )}

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {images.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => downloadImage(images[currentImageIndex], currentImageIndex)}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Imagem Atual
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;