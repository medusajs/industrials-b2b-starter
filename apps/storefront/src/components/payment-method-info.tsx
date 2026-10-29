import { getPaymentMethodInfo } from "@/lib/constants/payment-methods"

type PaymentMethodInfoProps = {
  provider_id: string;
}

const PaymentMethodInfo = ({ provider_id }: PaymentMethodInfoProps) => {
  const paymentInfo = getPaymentMethodInfo(provider_id)

  return (
    <div className="flex items-center gap-2">
      <span>{paymentInfo?.title || provider_id}</span>
      {paymentInfo?.icon}
    </div>
  )
}

export default PaymentMethodInfo