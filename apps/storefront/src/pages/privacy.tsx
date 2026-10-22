import { PolicyPage, PolicySection } from "@/components/policy-page"

const Privacy = () => (
  <PolicyPage
    title="Privacy Policy"
    intro="How ProLift Equipment collects and uses personal information."
  >
    <PolicySection heading="Information We Collect">
      <p>
        We collect the information you provide when you create a business account, request a quote
        or place an order, such as your name, company, email and addresses.
      </p>
    </PolicySection>
    <PolicySection heading="How We Use It">
      <p>
        We use this information to process orders and quotes, manage your account and communicate
        with you about your purchases.
      </p>
    </PolicySection>
  </PolicyPage>
)

export default Privacy
