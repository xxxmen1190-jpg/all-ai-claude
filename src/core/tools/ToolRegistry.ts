import type { ToolName, ToolResult } from '../../types'
import { Logger } from '../logging/Logger'

export interface ToolContext {
  signal?: AbortSignal
}

export interface Tool {
  name: ToolName
  label: string
  description: string
  execute: (input: string, ctx: ToolContext) => Promise<ToolResult>
}

/**
 * Central registry for all callable tools. To add a new tool in the future:
 *   1. Implement a Tool object (see tools/*.ts for examples)
 *   2. Call ToolRegistry.register(tool) once at app startup
 * AgentRunner and step definitions never need to change.
 */
class ToolRegistryImpl {
  private tools = new Map<ToolName, Tool>()

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      Logger.warn('ToolRegistry', `overwriting existing tool registration: ${tool.name}`)
    }
    this.tools.set(tool.name, tool)
  }

  get(name: ToolName): Tool {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`ToolRegistry: tool "${name}" is not registered`)
    return tool
  }

  has(name: ToolName): boolean {
    return this.tools.has(name)
  }

  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  async execute(name: ToolName, input: string, ctx: ToolContext = {}): Promise<ToolResult> {
    const tool = this.get(name)
    try {
      Logger.info('ToolRegistry', `executing tool: ${name}`, { input: input.slice(0, 80) })
      const result = await tool.execute(input, ctx)
      Logger.info('ToolRegistry', `tool finished: ${name}`, { success: result.success })
      return result
    } catch (error) {
      Logger.error('ToolRegistry', `tool failed: ${name}`, { error: (error as Error).message })
      return { tool: name, success: false, error: (error as Error).message }
    }
  }
}

export const ToolRegistry = new ToolRegistryImpl()
