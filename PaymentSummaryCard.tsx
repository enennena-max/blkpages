import React from 'react';

interface PaymentSummaryCardProps {
  payMode: "full" | "deposit" | "venue";
  totalPrice: number;
  depositPercent?: number;
  allowPayAtVenue?: boolean;
  businessName?: string;
  onContinue?: () => void;
}

const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  payMode,
  totalPrice,
  depositPercent = 25,
  allowPayAtVenue = false,
  businessName = "Business",
  onContinue
}) => {
  // Calculate payment amounts based on payMode
  let depositAmount = 0;
  let remainingAmount = 0;
  let displayTitle = "";
  let displayAmount = 0;
  let secondaryInfo = "";

  if (payMode === "deposit" && depositPercent) {
    depositAmount = totalPrice * (depositPercent / 100);
    remainingAmount = totalPrice - depositAmount;
    displayTitle = "Deposit Required";
    displayAmount = depositAmount;
    secondaryInfo = `Balance £${remainingAmount.toFixed(2)} payable at ${businessName}`;
  } else if (payMode === "full") {
    displayTitle = "Total Amount";
    displayAmount = totalPrice;
    secondaryInfo = "Payment required at checkout";
  } else if (payMode === "venue") {
    displayTitle = "Pay at Venue";
    displayAmount = totalPrice;
    secondaryInfo = `Payment due when you arrive at ${businessName}`;
  }

  return (
    <div className="bg-white border border-[#D4AF37]/40 rounded-lg p-6 md:p-8 hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#D4AF37] text-xl">💳</span>
          <h2 className="text-black font-semibold text-lg">Booking Summary</h2>
        </div>
        <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/60 to-[#D4AF37]/20"></div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        {/* Main Amount Display */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-black">{displayTitle}</h3>
          <p className="text-lg text-[#D4AF37] font-semibold">
            {payMode === "full" && `Total Due Now: £${displayAmount.toFixed(2)}`}
            {payMode === "deposit" && `Total Due Now: £${depositAmount.toFixed(2)}`}
            {payMode === "venue" && `Total Due Now: £0`}
          </p>
          <p className="text-gray-500 text-sm">
            {payMode === "full" && secondaryInfo}
            {payMode === "deposit" && `Deposit: ${depositPercent}% due now (£${depositAmount.toFixed(2)}). Balance £${remainingAmount.toFixed(2)} payable at venue.`}
            {payMode === "venue" && `You'll pay the full amount directly to ${businessName || "the business"} on arrival.`}
          </p>
        </div>

        {/* Additional Payment Mode Information */}
        {payMode === "deposit" && (
          <div className="bg-[#D4AF37]/5 rounded-lg p-4 border border-[#D4AF37]/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Total Service Cost:</span>
              <span className="font-medium text-black">£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-700">Deposit ({depositPercent}%):</span>
              <span className="font-medium text-[#D4AF37]">£{depositAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-[#D4AF37]/20">
              <span className="text-gray-700">Remaining Balance:</span>
              <span className="font-medium text-gray-600">£{remainingAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {payMode === "venue" && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-800">
                No payment required now. You'll pay when you arrive at the venue.
              </p>
            </div>
          </div>
        )}

        {payMode === "full" && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-800">
                Secure payment processing via Stripe. You'll receive an immediate confirmation.
              </p>
            </div>
          </div>
        )}

        {/* Payment Method Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Payment Method:</span>
            <span className="font-medium">
              {payMode === "full" && "Credit/Debit Card"}
              {payMode === "deposit" && "Card (Deposit) + Cash/Card (Remainder)"}
              {payMode === "venue" && "Cash/Card at Venue"}
            </span>
          </div>
        </div>

        {/* Continue to Payment Button */}
        <button 
          onClick={onContinue}
          className="mt-6 w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-md hover:bg-black hover:text-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] transition"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentSummaryCard;
