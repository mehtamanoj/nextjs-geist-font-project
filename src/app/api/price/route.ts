import { NextResponse } from 'next/server'
import { tradeData } from '@/lib/tradeData'

// Base price and scaling factors
const BASE_PRICE = 100
const PRICE_SCALE = 10000
const TIME_SCALE = 300000 // 5 minutes in milliseconds

function calculateNewPrice(): number {
  try {
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
