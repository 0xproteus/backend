import type { ZZMarketInfo, ZZServiceHandler } from 'src/types'

export const marketsreq: ZZServiceHandler = async (
  api,
  ws,
  [chainId, detailedFlag]
) => {  
  if (!api.VALID_CHAINS.includes(chainId)) {
    const errorMsg = { op: 'error', args: ['marketsreq', `${chainId} is not a valid chain id. Use ${api.VALID_CHAINS}`] }
    if (ws) ws.send(JSON.stringify(errorMsg))
    console.log(`Error, ${chainId} is not a valid chain id.`)
    return errorMsg
  }

  let marketsMsg
  if (detailedFlag) {
    const marketInfo: ZZMarketInfo[] = []
    const activeMarkets = await api.redis.SMEMBERS(`activemarkets:${chainId}`)
    const result = activeMarkets.map(async (market: string) => {
      const details: ZZMarketInfo = await api.getMarketInfo(market, chainId)
      if (details) marketInfo.push(details)
    })
    await Promise.all(result)
    marketsMsg = { op: 'marketinfo2', args: [marketInfo] }

    if (ws) {
      ws.send(JSON.stringify(marketsMsg))
      // fetch lastPrices after sending marketsMsg for some delay
      const lastPrices = await api.getLastPrices(chainId)
      ws.send(JSON.stringify({ op: 'lastprice', args: [lastPrices] }))
    }
  } else {
    const lastPrices = await api.getLastPrices(chainId)
    marketsMsg = { op: 'lastprice', args: [lastPrices] }
    if (ws) {
      ws.send(JSON.stringify({ op: 'lastprice', args: [lastPrices] }))
    }
  }
  return marketsMsg
}
