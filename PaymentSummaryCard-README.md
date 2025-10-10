# PaymentSummaryCard Component

A reusable React component for displaying payment information in BlkPages booking system. Matches the black, white, and gold illuminated aesthetic.

## 🎯 Features

- **Three Payment Modes**: Full payment, deposit payment, and pay at venue
- **Dynamic Calculations**: Automatically calculates deposit amounts and remaining balances
- **Responsive Design**: Works on all screen sizes
- **BlkPages Styling**: Matches the brand's black/white/gold aesthetic
- **TypeScript Support**: Full type safety with TypeScript definitions

## 📦 Installation

```bash
# Copy the component file to your project
cp PaymentSummaryCard.jsx src/components/
# or for TypeScript
cp PaymentSummaryCard.tsx src/components/
```

## 🚀 Usage

### Basic Usage

```jsx
import PaymentSummaryCard from './components/PaymentSummaryCard';

// Full payment
<PaymentSummaryCard
  payMode="full"
  totalPrice={85.00}
  businessName="Royal Hair Studio"
/>

// Deposit payment
<PaymentSummaryCard
  payMode="deposit"
  totalPrice={120.00}
  depositPercent={25}
  businessName="Elite Barber Shop"
/>

// Pay at venue
<PaymentSummaryCard
  payMode="venue"
  totalPrice={65.00}
  businessName="Glamour Beauty"
/>
```

## 🔧 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `payMode` | `"full" \| "deposit" \| "venue"` | ✅ | - | Payment mode determining display logic |
| `totalPrice` | `number` | ✅ | - | Total price of the service(s) |
| `depositPercent` | `number` | ❌ | `25` | Deposit percentage (only used for deposit mode) |
| `allowPayAtVenue` | `boolean` | ❌ | `false` | Whether venue payment is allowed |
| `businessName` | `string` | ❌ | `"Business"` | Name of the business for display |

## 💳 Payment Modes

### Full Payment (`payMode="full"`)
- Displays total amount to be paid at checkout
- Shows green confirmation message about Stripe processing
- Payment method: Credit/Debit Card

### Deposit Payment (`payMode="deposit"`)
- Calculates deposit amount based on `depositPercent`
- Shows breakdown of total cost, deposit, and remaining balance
- Displays when remaining amount is due
- Payment method: Card (Deposit) + Cash/Card (Remainder)

### Pay at Venue (`payMode="venue"`)
- Shows total amount to be paid at the venue
- Displays blue info message about no upfront payment
- Payment method: Cash/Card at Venue

## 🎨 Styling

The component uses Tailwind CSS classes and follows BlkPages design system:

- **Container**: White background with gold border (`border-[#D4AF37]/40`)
- **Hover Effect**: Soft gold glow (`hover:shadow-[0_0_12px_rgba(212,175,55,0.25)]`)
- **Typography**: Bold black headings, gold amounts, gray secondary text
- **Responsive**: Padding adjusts from `p-6` to `p-8` on medium screens and up

## 📱 Responsive Design

- **Mobile**: Single column layout with `p-6` padding
- **Tablet**: Maintains single column with `p-8` padding
- **Desktop**: Optimized spacing and typography

## 🧪 Testing

Use the included demo component to test different scenarios:

```jsx
import PaymentSummaryCardDemo from './PaymentSummaryCardDemo';

// Render the demo to see all payment modes
<PaymentSummaryCardDemo />
```

## 🔄 Integration with BlkPages

This component integrates seamlessly with the existing BlkPages booking system:

1. **Payment Settings**: Use with `getBusinessPaymentSettings()` function
2. **Business Data**: Pass business name from business profile data
3. **Booking Flow**: Display in booking review and payment pages

## 📋 Example Integration

```jsx
// In your booking component
const { payMode, totalPrice, depositPercent, businessName } = getPaymentSettings();

return (
  <div className="booking-summary">
    <PaymentSummaryCard
      payMode={payMode}
      totalPrice={totalPrice}
      depositPercent={depositPercent}
      businessName={businessName}
    />
  </div>
);
```

## 🎯 Accessibility

- **Semantic HTML**: Uses proper heading hierarchy
- **Color Contrast**: Meets WCAG guidelines
- **Screen Readers**: Properly labeled elements
- **Keyboard Navigation**: Focusable elements

## 🔧 Customization

To customize the component:

1. **Colors**: Modify the gold color values (`#D4AF37`)
2. **Spacing**: Adjust padding and margin classes
3. **Typography**: Change font sizes and weights
4. **Icons**: Replace SVG icons with your preferred icon library

## 📄 License

This component is part of the BlkPages project and follows the same licensing terms.
