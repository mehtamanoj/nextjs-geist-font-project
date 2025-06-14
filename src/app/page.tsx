"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { PriceChart } from "./trading/components/PriceChart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TradeRecord {
  type: "buy" | "sell"
  quantity: number
  price: number
  timestamp: Date
  profit?: number
}

export default function TradingGame() {
  const searchParams = useSearchParams()
  const mobile = searchParams.get('mobile')

  // State management
  const [currentPrice, setCurrentPrice] = useState<number>(100)
  const [priceHistory, setPriceHistory] = useState<{ time: Date; price: number }[]>([])
  const [walletBalance, setWalletBalance] = useState<number>(10000)
  const [portfolio, setPortfolio] = useState<{ shares: number; avgPrice: number }>({ shares: 0, avgPrice: 0 })
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([])
  const [globalStats, setGlobalStats] = useState<{ globalHouseProfit: number }>({ globalHouseProfit: 0 })
  const [error, setError] = useState<string>("")
  const [tradeQuantity, setTradeQuantity] = useState<string>("")
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false)
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")

  // Show error if mobile number is not provided
  if (!mobile) {
    return (
      <main className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              Please provide a mobile number in the URL (e.g., ?mobile=9929999022)
            </AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  // Subscribe to SSE price updates
  useEffect(() => {
    const eventSource = new EventSource('/api/price')
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setCurrentPrice(data.price)
      setPriceHistory(prev => [...prev, { time: new Date(), price: data.price }])
    }
    eventSource.onerror = () => {
      eventSource.close()
    }
    return () => {
      eventSource.close()
    }
  }, [])

  // Fetch initial user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/trades?mobile=${mobile}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setWalletBalance(data.walletBalance)
            setPortfolio(data.portfolio)
            setTradeHistory(data.tradeHistory)
            setGlobalStats({ globalHouseProfit: data.globalHouseProfit })
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    }
    fetchUserData()
  }, [mobile])

  // Trade execution handlers
  const handleTrade = async () => {
    const quantity = parseInt(tradeQuantity)
    
    if (isNaN(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    try {
      const response = await fetch(`/api/trades?mobile=${mobile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: tradeType,
          quantity,
          price: currentPrice
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      // Update all state from backend response
      setWalletBalance(data.walletBalance)
      setPortfolio(data.portfolio)
      setTradeHistory(data.tradeHistory)
      setGlobalStats(prev => ({
        ...prev,
        globalHouseProfit: data.globalHouseProfit
      }))

      setTradeQuantity("")
      setIsTradeModalOpen(false)
      setError("")
    } catch (err) {
      console.error('Error executing trade:', err)
      setError("Failed to execute trade. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Game Title and Instructions */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-500">Stock Trading Game</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Trade stocks in real-time with simulated market prices. Buy low, sell high, and watch your portfolio grow. 
            Remember: the house takes 20% of your profits on successful trades!
          </p>
          <p className="text-blue-500">User: {mobile}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Price Chart Card */}
            <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-blue-500/20 transition-colors">
              <h2 className="text-2xl font-bold mb-6 text-blue-500">Stock Price</h2>
              <div className="h-[300px] relative">
                {/* Price display */}
                <div className="absolute top-0 right-0 bg-blue-500/10 px-4 py-2 rounded-lg">
                  <span className="text-2xl font-mono text-blue-500">
                    ${currentPrice.toFixed(2)}
                  </span>
                </div>
                <PriceChart data={priceHistory} />
              </div>
            </Card>

            {/* Portfolio Overview Card */}
            <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-blue-500/20 transition-colors">
              <h2 className="text-2xl font-bold mb-6 text-blue-500">Portfolio Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-blue-500/20 transition-colors">
                  <p className="text-sm text-zinc-400 mb-2">Wallet Balance</p>
                  <p className="text-2xl font-mono text-green-500">
                    ${walletBalance.toFixed(2)}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-blue-500/20 transition-colors">
                  <p className="text-sm text-zinc-400 mb-2">Shares Owned</p>
                  <p className="text-2xl font-mono text-blue-500">
                    {portfolio.shares}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-blue-500/20 transition-colors">
                  <p className="text-sm text-zinc-400 mb-2">Average Price</p>
                  <p className="text-2xl font-mono text-yellow-500">
                    ${portfolio.avgPrice.toFixed(2)}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-blue-500/20 transition-colors">
                    <p className="text-sm text-zinc-400 mb-2">Global House Profit</p>
                    <p className="text-2xl font-mono text-purple-500">
                      ${globalStats.globalHouseProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Trade Actions */}
            <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-blue-500/20 transition-colors">
              <h2 className="text-2xl font-bold mb-6 text-blue-500">Trade Actions</h2>
              <div className="flex gap-4 mt-2">
                <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6"
                      onClick={() => {
                        setTradeType("buy")
                        setError("")
                      }}
                    >
                      Buy
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-lg py-6"
                      onClick={() => {
                        setTradeType("sell")
                        setError("")
                      }}
                    >
                      Sell
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 border">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-blue-500">
                        {tradeType === "buy" ? "Buy Shares" : "Sell Shares"}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-zinc-400 mt-2">
                        {tradeType === "buy" 
                          ? "Enter the number of shares you want to purchase at the current market price." 
                          : "Enter the number of shares you want to sell at the current market price."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-zinc-800 p-4 rounded-lg">
                          <p className="text-sm text-zinc-400 mb-1">Current Price</p>
                          <p className="text-xl font-mono text-blue-500">${currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-zinc-800 p-4 rounded-lg">
                          <p className="text-sm text-zinc-400 mb-1">Total {tradeType === "buy" ? "Cost" : "Proceeds"}</p>
                          <p className="text-xl font-mono text-green-500">
                            ${(parseFloat(tradeQuantity || "0") * currentPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-lg p-6"
                      />
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsTradeModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleTrade}>
                          Confirm {tradeType === "buy" ? "Purchase" : "Sale"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Trade History */}
            <Card className="p-6 bg-zinc-900 border-zinc-800 hover:border-blue-500/20 transition-colors">
              <h2 className="text-2xl font-bold mb-6 text-blue-500">Trade History</h2>
              <div className="overflow-x-auto">
                <Table className="border border-zinc-800 rounded-lg overflow-hidden">
                  <TableHeader>
                    <TableRow className="hover:bg-zinc-800/50">
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Profit/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.map((trade, index) => (
                      <TableRow key={index} className="hover:bg-zinc-800/50">
                        <TableCell className={trade.type === "buy" ? "text-green-500" : "text-red-500"}>
                          {trade.type.toUpperCase()}
                        </TableCell>
                        <TableCell>{trade.quantity}</TableCell>
                        <TableCell>${trade.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {trade.profit !== undefined && (
                            <span className={trade.profit >= 0 ? "text-green-500" : "text-red-500"}>
                              ${trade.profit.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
