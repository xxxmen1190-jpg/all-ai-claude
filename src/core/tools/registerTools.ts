import { ToolRegistry } from './ToolRegistry'
import { createWebSearchTool } from './WebSearchTool'
import { createSummarizeTool } from './SummarizeTool'
import { createTranslationTool } from './TranslationTool'
import { createCodeGenTool } from './CodeGenTool'
import { createImageGenTool } from './ImageGenTool'
import { createVoiceGenTool } from './VoiceGenTool'
import { FileReaderTool } from './FileReaderTool'
import type { AIService } from '../AIService'
import type { MediaService } from '../MediaService'

/**
 * Registers every built-in tool. Call once when AIService/MediaService
 * instances are created (see useAgent hook in Stage 4 UI wiring).
 * Adding a new tool later: write ToolXyz.ts, then add one line here.
 */
export function registerTools(aiService: AIService, mediaService: MediaService): void {
  ToolRegistry.register(createWebSearchTool(aiService))
  ToolRegistry.register(createSummarizeTool(aiService))
  ToolRegistry.register(createTranslationTool(aiService))
  ToolRegistry.register(createCodeGenTool(aiService))
  ToolRegistry.register(createImageGenTool(mediaService))
  ToolRegistry.register(createVoiceGenTool(mediaService))
  ToolRegistry.register(FileReaderTool)
}
