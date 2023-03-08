import { ServerWebSocket } from "bun"

declare global {
  /** `true` in production mode. */
  const production: boolean
  /** `true` in development mode. */
  const development: boolean
  /** Absolute path of the project root. */
  const root: string
  /** Returns a `<script>` tag with live reload script. Pass `false` to disable. */
  function liveReload(enabled?: boolean): Element | null
  /** Create a `Response` that redirects the request.  */
  function redirect(location: string, temporary = false): Response

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
