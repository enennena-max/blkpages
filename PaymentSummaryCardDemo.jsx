import React from 'react';
import PaymentSummaryCard from './PaymentSummaryCard';

const PaymentSummaryCardDemo = () => {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          PaymentSummaryCard Component Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full Payment Example */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Full Payment</h2>
            <PaymentSummaryCard
              payMode="full"
              totalPrice={85.00}
              businessName="Royal Hair Studio"
            />
          </div>

          {/* Deposit Payment Example */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Deposit Payment</h2>
            <PaymentSummaryCard
              payMode="deposit"
              totalPrice={120.00}
              depositPercent={25}
              businessName="Elite Barber Shop"
            />
          </div>

          {/* Pay at Venue Example */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Pay at Venue</h2>
            <PaymentSummaryCard
              payMode="venue"
              totalPrice={65.00}
              businessName="Glamour Beauty"
            />
          </div>

          {/* Different Deposit Percentage */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">30% Deposit</h2>
            <PaymentSummaryCard
              payMode="deposit"
              totalPrice={200.00}
              depositPercent={30}
              businessName="Premium Spa"
            />
          </div>

          {/* Higher Value Service */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Premium Service</h2>
            <PaymentSummaryCard
              payMode="full"
              totalPrice={350.00}
              businessName="Luxury Salon"
            />
          </div>

          {/* Venue Payment with Long Business Name */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Long Business Name</h2>
            <PaymentSummaryCard
              payMode="venue"
              totalPrice={45.00}
              businessName="The Very Long Business Name That Might Wrap"
            />
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6">
          <h2 className="text-white text-xl font-bold mb-4">Usage Examples</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-gold font-semibold mb-2">Full Payment:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`<PaymentSummaryCard
  payMode="full"
  totalPrice={85.00}
  businessName="Royal Hair Studio"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-gold font-semibold mb-2">Deposit Payment:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`<PaymentSummaryCard
  payMode="deposit"
  totalPrice={120.00}
  depositPercent={25}
  businessName="Elite Barber Shop"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-gold font-semibold mb-2">Pay at Venue:</h3>
              <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`<PaymentSummaryCard
  payMode="venue"
  totalPrice={65.00}
  businessName="Glamour Beauty"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryCardDemo;
