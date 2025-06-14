import { NextResponse } from 'next/server'
import { tradeData } from '@/lib/tradeData'

// Base price and scaling factors
const BASE_PRICE = 100
const VOLATILITY = 0.02 // 2% volatility
const TRADE_IMPACT = 0.001 // 0.1% price impact per trade
const TREND_FACTOR = 0.3 // 30% trend influence

let lastPrice = BASE_PRICE
let trend = 0 // Range: -1 to 1

function calculateNewPrice(): number {
  try {
    // Update trend (slowly shifts between bearish and bullish)
    trend = Math.max(-1, Math.min(1, trend + (Math.random() - 0.5) * 0.1))
    
    // Calculate trade pressure (sells push price down, buys push price up)
    const tradePressure = (tradeData.totalSellValue - tradeData.totalBuyValue) * TRADE_IMPACT
    
    // Random volatility component
    const volatility = (Math.random() - 0.5) * 2 * VOLATILITY * lastPrice
    
    // Trend component
    const trendComponent = trend * TREND_FACTOR
    
    // Calculate price change
    const priceChange = volatility + tradePressure + trendComponent
    
    // Update and return new price
    lastPrice = Math.max(lastPrice * (1 + priceChange), 0.01)
    return lastPrice
  } catch (error) {
    console.error('Error calculating price:', error)
    return BASE_PRICE // Return base price as fallback
  }
}

export async function GET(req: Request) {
  try {
    let interval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      start(controller) {
        try {
          const encoder = new TextEncoder()

          const sendPrice = () => {
            try {
              const price = calculateNewPrice()
              const data = `data: ${JSON.stringify({ price })}\n\n`
              controller.enqueue(encoder.encode(data))
            } catch (error) {
              console.error('Error sending price:', error)
              // Send base price as fallback
              const data = `data: ${JSON.stringify({ price: BASE_PRICE })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }

          sendPrice() // Initial price
          interval = setInterval(sendPrice, 5000)

          // Clean up on abort
          req.signal.addEventListener('abort', () => {
            if (interval) {
              clearInterval(interval)
              interval = null
            }
            try {
              controller.close()
            } catch (error) {
              console.error('Error closing controller:', error)
            }
          })
        } catch (error) {
          console.error('Error in stream start:', error)
          controller.error(error)
        }
      },
      cancel() {
        if (interval) {
          clearInterval(interval)
          interval = null
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error('Error creating stream:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}
