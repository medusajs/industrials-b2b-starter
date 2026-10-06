import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useState, useCallback, memo } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = memo(function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 rounded-lg">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => {
            const isFirstImage = index === 0
            const isCriticalImage = index <= 1
            
            return (
              <div
                key={image.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                {!!image.url && (
                  <img
                    src={image.url}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt={isFirstImage ? "Main product image" : `Product image ${index + 1}`}
                    loading={isCriticalImage ? "eager" : "lazy"}
                    fetchPriority={isFirstImage ? "high" : undefined}
                    decoding="async"
                  />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md transition-colors cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md transition-colors cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                index === currentIndex 
                  ? "border-accent ring-2 ring-accent/30" 
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

ImageGallery.displayName = "ImageGallery"

export { ImageGallery }
export default ImageGallery