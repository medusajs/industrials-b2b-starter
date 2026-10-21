import { PolicyPage, PolicySection } from "@/components/policy-page"

const Terms = () => (
  <PolicyPage
    title="Terms of Service"
    intro="The terms that apply to purchases from ProLift Equipment."
  >
    <PolicySection heading="Accounts">
      <p>
        Business accounts are subject to approval. Pricing shown after sign-in applies to your
        company account.
      </p>
    </PolicySection>
    <PolicySection heading="Orders and Quotes">
      <p>
        Orders are confirmed once payment or an approved quote is accepted. Prices and availability
        may change until an order is placed.
      </p>
    </PolicySection>
  </PolicyPage>
)

export default Terms
