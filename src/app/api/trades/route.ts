import { NextResponse } from 'next/server'
import { tradeData } from '@/lib/tradeData'
import { getUserData, updateUserData } from '@/lib/userData'

export async function POST(req: Request) {
  try {
    // Get mobile number from URL
    const url = new URL(req.url)
    const mobile = url.searchParams.get('mobile')

    if (!mobile) {
      return NextResponse.json({ success: false, error: 'Mobile number is required' }, { status: 400 })
    }

    const { type, quantity, price } = await req.json()
    const userData = getUserData(mobile)

    if (type === 'buy') {
      const totalCost = quantity * price
      if (totalCost > userData.walletBalance) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 })
      }
      const newTotalShares = userData.portfolio.shares + quantity
      const newAvgPrice = ((userData.portfolio.shares * userData.portfolio.avgPrice) + (quantity * price)) / newTotalShares

      userData.walletBalance -= totalCost
      userData.portfolio = { shares: newTotalShares, avgPrice: newAvgPrice }
      userData.tradeHistory.push({ type, quantity, price, timestamp: new Date() })

      // Update total buy value
      tradeData.totalBuyValue += totalCost
    } else if (type === 'sell') {
      if (quantity > userData.portfolio.shares) {
        return NextResponse.json({ success: false, error: 'Insufficient shares' }, { status: 400 })
      }
      const saleProceeds = quantity * price
      const costBasis = quantity * userData.portfolio.avgPrice
      const tradeProfit = saleProceeds - costBasis

      // Update total sell value
      tradeData.totalSellValue += saleProceeds

      if (tradeProfit > 0) {
        const houseCut = tradeProfit * 0.2
        tradeData.globalHouseProfit += houseCut
        userData.walletBalance += saleProceeds - houseCut
      } else {
        userData.walletBalance += saleProceeds
      }

      userData.portfolio.shares -= quantity
      if (userData.portfolio.shares === 0) {
        userData.portfolio.avgPrice = 0
      }
      userData.tradeHistory.push({ type, quantity, price, profit: tradeProfit, timestamp: new Date() })
    }

    // Update user data in store
    updateUserData(mobile, userData)

    return NextResponse.json({
      success: true,
      walletBalance: userData.walletBalance,
      portfolio: userData.portfolio,
      tradeHistory: userData.tradeHistory,
      globalHouseProfit: tradeData.globalHouseProfit
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process trade' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Get mobile number from URL
  const url = new URL(req.url)
  const mobile = url.searchParams.get('mobile')

  if (!mobile) {
    return NextResponse.json({ success: false, error: 'Mobile number is required' }, { status: 400 })
  }

  const userData = getUserData(mobile)

  return NextResponse.json({
    success: true,
    walletBalance: userData.walletBalance,
    portfolio: userData.portfolio,
    tradeHistory: userData.tradeHistory,
    globalHouseProfit: tradeData.globalHouseProfit
  })
}
