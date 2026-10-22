import { PolicyPage, PolicySection } from "@/components/policy-page"
import { formatPrice } from "@/lib/utils/price"
import { useLoaderData } from "@tanstack/react-router"

const Shipping = () => {
  const { current, currencyCode, regions } = useLoaderData({ from: "/$countryCode/shipping" })

  return (
    <PolicyPage
      title="Shipping Information"
      intro="Equipment and parts ship direct-to-dock from our distribution centers."
    >
      {current && (
        <PolicySection heading="Shipping Costs">
          <p>
            {current.shippingRate === 0
              ? "Standard shipping is free on every order."
              : `Standard shipping is ${formatPrice({ amount: current.shippingRate, currency_code: currencyCode })} per order.`}{" "}
            Freight for oversized equipment is confirmed on your quote.
          </p>
        </PolicySection>
      )}

      <PolicySection heading="Order Processing">
        <p>
          Orders are processed and dispatched within{" "}
          {current ? `${current.handlingDays.min}-${current.handlingDays.max}` : "a few"} business days.
          You'll receive tracking details once your order has shipped.
        </p>
      </PolicySection>

      {regions.length > 0 && (
        <PolicySection heading="Delivery Timeframes">
          <ul className="space-y-2">
            {regions.map(({ id, name, policies }) => (
              <li key={id}>
                <span className="font-semibold text-gray-900">{name}:</span>{" "}
                {policies.transitDays.min}-{policies.transitDays.max} business days after dispatch
              </li>
            ))}
          </ul>
          <p className="text-sm">Delivery times are estimates and begin from the date of dispatch.</p>
        </PolicySection>
      )}

      <PolicySection heading="International Orders">
        <p>
          International orders may be subject to customs duties and taxes charged by the destination
          country. These charges are the recipient's responsibility.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}

export default Shipping
