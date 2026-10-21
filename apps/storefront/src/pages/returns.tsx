import { PolicyPage, PolicySection } from "@/components/policy-page"
import { useLoaderData } from "@tanstack/react-router"

const Returns = () => {
  const { current, regions } = useLoaderData({ from: "/$countryCode/returns" })

  return (
    <PolicyPage
      title="Return Policy"
      intro="How to return equipment and parts purchased from ProLift Equipment."
    >
      {current && (
        <PolicySection heading="Return Window">
          <p>
            We accept {current.freeReturns ? "free " : ""}returns within {current.returnWindowDays} days
            of delivery for unused items in their original condition and packaging.{" "}
            {current.freeReturns
              ? "Return shipping is free."
              : "Return shipping costs are the customer's responsibility."}
          </p>
        </PolicySection>
      )}

      <PolicySection heading="How to Return an Item">
        <p>
          Contact your account manager or our team with your order number to request a return. We'll
          confirm eligibility and send return instructions.
        </p>
      </PolicySection>

      {regions.length > 0 && (
        <PolicySection heading="Returns by Region">
          <ul className="space-y-2">
            {regions.map(({ id, name, policies }) => (
              <li key={id}>
                <span className="font-semibold text-gray-900">{name}:</span> returns within{" "}
                {policies.returnWindowDays} days,{" "}
                {policies.freeReturns ? "free return shipping" : "return shipping paid by the customer"}
              </li>
            ))}
          </ul>
        </PolicySection>
      )}

      <PolicySection heading="Damaged or Defective Items">
        <p>
          If an item arrives damaged or defective, contact us as soon as possible with photos of the
          issue and we'll arrange a replacement or refund.
        </p>
      </PolicySection>

      <PolicySection heading="Refunds">
        <p>
          Approved refunds are issued to the original payment method once the returned item has been
          received and inspected.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}

export default Returns
