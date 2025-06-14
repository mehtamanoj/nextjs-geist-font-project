import { NextResponse } from 'next/server'
import { tradeData } from '@/lib/tradeData'

// Base price and scaling factors
const BASE_PRICE = 100
const PRICE_SCALE = 10000
const TIME_SCALE = 300000 // 5 minutes in milliseconds

function calculateNewPrice(): number {
  // Get current timestamp
  const timestamp = Date.now()
  
  // Calculate price based on time and trade data
  const timeComponent = Math.sin(timestamp / TIME_SCALE) * 2
  
  // Calculate price adjustment based on net trading value
  const netValue = tradeData.totalBuyValue - tradeData.totalSellValue
  const tradeComponent = netValue / PRICE_SCALE
  
  // Calculate new price using base price and components
  const newPrice = BASE_PRICE + timeComponent + tradeComponent

  // Ensure price doesn't go below minimum value
  return Math.max(newPrice, 0.01)
}

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const sendPrice = () => {
        const price = calculateNewPrice()
        const data = `data: ${JSON.stringify({ price })}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      sendPrice()
      const interval = setInterval(sendPrice, 5000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
