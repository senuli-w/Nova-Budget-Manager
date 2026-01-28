import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, runTransaction, Timestamp, orderBy } from 'firebase/firestore';
import { Transaction, TransactionType, Account } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDC2EPqMAo-laYO59IvHFwbqA65eqst0Jw",
  authDomain: "budgetmanager-21858.firebaseapp.com",
  projectId: "budgetmanager-21858",
  storageBucket: "budgetmanager-21858.firebasestorage.app",
  messagingSenderId: "817688844370",
  appId: "1:817688844370:web:00354b2f8a1a7c1de7e78b",
  measurementId: "G-45NDMNN1LN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Helpers ---

export const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, 'users', userId, collectionName);
};

// --- Operations ---

export const createAccount = async (userId: string, account: Omit<Account, 'id' | 'createdAt'>) => {
  const col = getUserCollection(userId, 'accounts');
  await addDoc(col, {
    ...account,
    createdAt: Date.now()
  });
};

export const deleteAccount = async (userId: string, accountId: string) => {
  const ref = doc(db, 'users', userId, 'accounts', accountId);
  await deleteDoc(ref);
};

// --- Budget Operations ---

export const saveBudget = async (userId: string, budget: { category: string; limit: number }) => {
  const col = getUserCollection(userId, 'budgets');
  // Simple add, allowing multiple budgets per category if user wants (or they can manage deletion)
  // In a complex app, we might check for existing category and update instead.
  await addDoc(col, { 
    ...budget, 
    createdAt: Date.now() 
  });
};

export const deleteBudget = async (userId: string, budgetId: string) => {
  const ref = doc(db, 'users', userId, 'budgets', budgetId);
  await deleteDoc(ref);
};

export const addTransaction = async (userId: string, transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
  // Uses a Firestore transaction to ensure atomic updates of Account balances and Transaction creation
  await runTransaction(db, async (transaction) => {
    // 1. References
    const accountRef = doc(db, 'users', userId, 'accounts', transactionData.accountId);
    let toAccountRef = null;
    if (transactionData.toAccountId) {
      toAccountRef = doc(db, 'users', userId, 'accounts', transactionData.toAccountId);
    }
    const newTransactionRef = doc(collection(db, 'users', userId, 'transactions'));

    // 2. Reads
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error("Source account does not exist!");
    
    let toAccountDoc = null;
    if (toAccountRef) {
      toAccountDoc = await transaction.get(toAccountRef);
      if (!toAccountDoc.exists()) throw new Error("Destination account does not exist!");
    }

    // 3. Logic & Writes
    const currentBalance = accountDoc.data().balance || 0;
    let newBalance = currentBalance;
    const amount = Number(transactionData.amount);
    const fee = Number(transactionData.serviceFee || 0);

    if (transactionData.type === TransactionType.INCOME) {
      newBalance += amount;
    } else if (transactionData.type === TransactionType.EXPENSE) {
      newBalance -= amount;
    } else if (transactionData.type === TransactionType.TRANSFER && toAccountDoc) {
      // Deduct from source: amount + fee
      newBalance -= (amount + fee);
      
      // Add to dest: amount
      const toBalance = toAccountDoc.data().balance || 0;
      transaction.update(toAccountRef!, { balance: toBalance + amount });
    }

    // Update source
    transaction.update(accountRef, { balance: newBalance });

    // Create Transaction Record
    transaction.set(newTransactionRef, {
      ...transactionData,
      createdAt: Date.now()
    });
  });
};