import { db } from './firebaseConfig'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function runSeed() {
  // Basic idempotency: if you re-run, you just add more sample rows.
  // For a strict idempotent seed, query first and bail if docs exist.
  const now = new Date()

  // Users
  await addDoc(collection(db, 'users'), {
    name: 'Aisha Johnson',
    email: 'aisha.johnson@example.com',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'users'), {
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'users'), {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    createdAt: serverTimestamp()
  })

  // Businesses
  await addDoc(collection(db, 'businesses'), {
    name: 'Royal Hair Studio',
    status: 'active',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'businesses'), {
    name: 'Glow Spa',
    status: 'active',
    createdAt: serverTimestamp()
  })

  // Transactions (revenue)
  await addDoc(collection(db, 'transactions'), {
    amount: 35,
    description: 'Haircut',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'transactions'), {
    amount: 52,
    description: 'Hair + beard trim',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'transactions'), {
    amount: 28,
    description: 'Spa package',
    createdAt: serverTimestamp()
  })

  // Refunds
  await addDoc(collection(db, 'refunds'), {
    amount: 10,
    reason: 'Customer cancellation',
    createdAt: serverTimestamp()
  })
  await addDoc(collection(db, 'refunds'), {
    amount: 5,
    reason: 'Partial goodwill refund',
    createdAt: serverTimestamp()
  })
}


