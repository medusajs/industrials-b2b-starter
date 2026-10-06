import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingCart, DocumentText } from "@medusajs/icons"

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueShopping: () => void
  onRequestQuote: () => void
  isSubmitting?: boolean
  productTitle?: string
}

export function QuoteModal({
  isOpen,
  onClose,
  onContinueShopping,
  onRequestQuote,
  isSubmitting = false,
  productTitle,
}: QuoteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DocumentText className="w-5 h-5 text-accent" />
            </div>
            <span>Item Added for Quote</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {productTitle ? (
              <>
                <strong>{productTitle}</strong> has been added to your cart.
              </>
            ) : (
              "The item has been added to your cart."
            )}{" "}
            Would you like to add more items or request a quote now?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onContinueShopping}
            disabled={isSubmitting}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ShoppingCart className="w-4 h-4" />
            Continue Shopping
          </Button>
          <Button
            variant="primary"
            onClick={onRequestQuote}
            disabled={isSubmitting}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <DocumentText className="w-4 h-4" />
                Request Quote Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
