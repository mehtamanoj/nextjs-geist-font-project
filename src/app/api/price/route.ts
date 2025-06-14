import { NextResponse } from 'next/server'
import { tradeData } from '@/lib/tradeData'

let currentPrice = 100

function calculateNewPrice(current: number): number {
  // Calculate price adjustment based on net trading value
  const netValue = tradeData.totalBuyValue - tradeData.totalSellValue
  const priceAdjustment = netValue / 10000 // Scale factor to make price movements reasonable

  // Add small random noise for natural market movement
  const randomNoise = (Math.random() - 0.5) * 0.5

  // Calculate new price based on net value and noise
  const newPrice = current + priceAdjustment + randomNoise

  // Ensure price doesn't go below minimum value
  return Math.max(newPrice, 0.01)
}

export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let price = currentPrice

      const sendPrice = () => {
        price = calculateNewPrice(price)
        currentPrice = price
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
