interface Portfolio {
  shares: number
  avgPrice: number
}

interface TradeRecord {
  type: "buy" | "sell"
  quantity: number
  price: number
  timestamp: Date
  profit?: number
}

interface UserData {
  walletBalance: number
  portfolio: Portfolio
  tradeHistory: TradeRecord[]
}

// Store user data in a Map with mobile number as key
const userDataStore = new Map<string, UserData>()

export function getUserData(mobile: string): UserData {
  if (!userDataStore.has(mobile)) {
    // Initialize new user data if not exists
    userDataStore.set(mobile, {
      walletBalance: 10000,
      portfolio: { shares: 0, avgPrice: 0 },
      tradeHistory: []
    })
  }
  return userDataStore.get(mobile)!
}

export function updateUserData(mobile: string, data: UserData) {
  userDataStore.set(mobile, data)
}
