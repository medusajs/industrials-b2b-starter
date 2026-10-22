import { PolicyPage, PolicySection } from "@/components/policy-page"

const Contact = () => (
  <PolicyPage title="Contact Us" intro="Get in touch with the ProLift Equipment team.">
    <PolicySection heading="Phone">
      <p>
        Call <a href="tel:+18007765438" className="text-teal-600 hover:text-teal-700">1-800-PROLIFT</a>{" "}
        to speak with an equipment specialist.
      </p>
    </PolicySection>
    <PolicySection heading="Account and Order Support">
      <p>Signed-in business customers can manage orders and quotes from their account dashboard.</p>
    </PolicySection>
  </PolicyPage>
)

export default Contact
