import { ServerWebSocket } from "bun"

declare global {
  type Handler = (request: Request) => Response

  interface Route {
    type: string
    language: string
    isParam: boolean
    isWild: boolean
    keys: string[]
    pattern: RegExp
    path: string
  }

  interface Context {
    request: Request
    route: Route
    url: URL
    production: boolean
    development: boolean
  }

  type SquirtWebSocket<Parameters = unknown> = ServerWebSocket<SquirtWebSocketData<Parameters>>

  type SquirtWebSocketData<Parameters> =
  | SquirtWebSocketLiveReloadData
  | SquirtWebSocketRouteData<Parameters>

  interface SquirtWebSocketLiveReloadData {
    type: "live-reload"
  }

  interface SquirtWebSocketRouteData<Parameters> {
    type: "route"
    url: string
    parameters?: Parameters
  }

  interface SquirtWebSocketUpgrade<Parameters> {
    headers?: HeadersInit
    parameters?: Parameters
  }

  interface SocketHandler<Parameters = unknown> {
    upgrade?: (request: Request) => void | Promise<void> | SquirtWebSocketUpgrade<Parameters> | Promise<SquirtWebSocketUpgrade<Parameters>>
    open?: (ws: SquirtWebSocket<Parameters>) => void | Promise<void>
    message?: (ws: SquirtWebSocket<Parameters>, message: string | Uint8Array) => void | Promise<void>
    close?: (ws: SquirtWebSocket<Parameters>, code: number, message: string) => void | Promise<void>
    drain?: (ws: SquirtWebSocket<Parameters>) => void | Promise<void>
  }
}
