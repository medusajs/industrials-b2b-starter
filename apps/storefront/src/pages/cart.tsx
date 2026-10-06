import {
  CartLineItem,
  CartSummary,
  CartEmpty,
  CartPromo,
} from "@/components/cart"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { CheckoutStepKey } from "@/lib/types/global"
import { useCart, useCreateCart } from "@/lib/hooks/use-cart"
import { useCreateQuoteFromCart } from "@/lib/hooks/use-quotes"
import { useAuth } from "@/lib/hooks/use-auth"
import { sortCartItems, getStoredCart } from "@/lib/utils/cart"
import { ShoppingCart, DocumentText } from "@medusajs/icons"
import { Link, useLoaderData, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

const DEFAULT_CART_FIELDS =
  "id, *items, total, currency_code, subtotal, item_subtotal, shipping_total, discount_total, tax_total, *promotions"

const Cart = () => {
  const { region, countryCode } = useLoaderData({
    from: "/$countryCode/cart",
  })
  const { data: cart, isLoading: cartLoading } = useCart({
    fields: DEFAULT_CART_FIELDS,
  })
  const createCartMutation = useCreateCart()
  const createQuoteFromCartMutation = useCreateQuoteFromCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Auto-create cart if none exists
  if (!cart && !cartLoading && !createCartMutation.isPending) {
    createCartMutation.mutate({ region_id: region.id })
  }

  const cartItems = sortCartItems(cart?.items || [])
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const handleRequestQuote = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to request a quote")
      navigate({ to: `/${countryCode}/account/login` })
      return
    }
    
    const cartId = getStoredCart()
    if (!cartId) {
      toast.error("No cart found")
      return
    }

    createQuoteFromCartMutation.mutate(
      { cart_id: cartId },
      {
        onSuccess: () => {
          toast.success("Quote request submitted!")
          navigate({ to: `/${countryCode}/quotes` })
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to create quote")
        },
      }
    )
  }

  return (
    <DashboardPageLayout>
      {cartLoading ? (
        <Loading />
      ) : cartItems.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Your Cart</h1>
                <p className="text-sm text-text-secondary">
                  {itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
                </p>
              </div>
            </div>
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Cart Items Card */}
            <div className="flex-1 min-w-0 bg-surface border border-border rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface-hover/50">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Order Items
                </h2>
              </div>
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    cart={cart!}
                    fields={DEFAULT_CART_FIELDS}
                  />
                ))}
              </div>
            </div>

            {/* Summary Card */}
            {cart && (
              <div className="w-full lg:w-96 space-y-4">
                {/* Order Summary */}
                <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-surface-hover/50">
                    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      Order Summary
                    </h2>
                  </div>
                  <div className="p-6">
                    <CartSummary cart={cart} />
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-surface-hover/50">
                    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      Promo Code
                    </h2>
                  </div>
                  <div className="p-6">
                    <CartPromo cart={cart} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link to="/$countryCode/checkout" params={{ countryCode }} search={{ step: CheckoutStepKey.ADDRESSES }} className="block">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="secondary" 
                    className="w-full flex items-center justify-center gap-2" 
                    size="lg"
                    onClick={handleRequestQuote}
                    disabled={createQuoteFromCartMutation.isPending}
                  >
                    <DocumentText className="w-5 h-5" />
                    {createQuoteFromCartMutation.isPending ? "Submitting..." : "Request a Quote"}
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-4 text-xs text-text-muted pt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Secure Checkout
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    Fast Shipping
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageLayout>
  )
}

export default Cart
