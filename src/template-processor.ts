import { HomeAssistant, TemplateItem, ProcessedTemplate } from './types';
import { ErrorHandler } from './error-handler';

export class TemplateProcessor {
  private hass: HomeAssistant;
  private errorHandler: ErrorHandler;

  constructor(hass: HomeAssistant, errorHandler: ErrorHandler) {
    this.hass = hass;
    this.errorHandler = errorHandler;
  }

  async processTemplate(template: string): Promise<ProcessedTemplate> {
    try {
      // Use the WebSocket API to render the template
      const result = await this.hass.callWS({
        type: 'render_template',
        template: template,
      });

      let items: TemplateItem[] = [];

      if (result) {
        try {
          // The result should already be parsed
          if (Array.isArray(result)) {
            items = result;
          } else if (typeof result === 'string') {
            // Try to parse the string result as JSON first
            try {
              const parsed = JSON.parse(result);
              items = Array.isArray(parsed) ? parsed : [parsed];
            } catch (jsonError) {
              // If JSON parsing fails, try to parse as YAML-like structure
              items = this.parseYamlLikeTemplate(result);
            }
          } else {
            items = [result];
          }
        } catch (parseError) {
          console.warn('Template Loop Card: Could not parse template result:', result);
        }
      }

      // Validate that each item has a type property
      items = items.filter((item) => {
        if (typeof item === 'object' && item !== null && 'type' in item) {
          return true;
        }
        console.warn('Template Loop Card: Skipping invalid item (missing type):', item);
        return false;
      });

      return { items };
    } catch (error) {
      const errorMessage = this.errorHandler.handleTemplateError(error as Error, template);
      return {
        items: [],
        error: errorMessage,
      };
    }
  }

  private parseYamlLikeTemplate(templateResult: string): TemplateItem[] {
    const items: TemplateItem[] = [];

    try {
      // Split by lines and process each potential YAML item
      const lines = templateResult.split('\n').filter((line) => line.trim());
      let currentItem: any = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if this is a new item (starts with -)
        if (trimmedLine.startsWith('- ')) {
          // Save previous item if exists
          if (currentItem) {
            items.push(currentItem);
          }

          // Start new item
          const itemContent = trimmedLine.substring(2).trim();
          if (itemContent.includes(':')) {
            const [key, ...valueParts] = itemContent.split(':');
            currentItem = {
              [key.trim()]: valueParts.join(':').trim(),
            };
          }
        } else if (currentItem && trimmedLine.includes(':')) {
          // Add property to current item
          const [key, ...valueParts] = trimmedLine.split(':');
          currentItem[key.trim()] = valueParts.join(':').trim();
        }
      }

      // Don't forget the last item
      if (currentItem) {
        items.push(currentItem);
      }
    } catch (error) {
      console.error('Template Loop Card: Failed to parse YAML-like template result:', error);
    }

    return items;
  }

  // Alternative method using Home Assistant's built-in template rendering
  async processTemplateAlternative(template: string): Promise<ProcessedTemplate> {
    try {
      // Use the connection to call the template WS API directly
      const result = await this.hass.callWS({
        type: 'render_template',
        template: template,
      });

      let items: TemplateItem[] = [];

      if (result) {
        try {
          // The result should already be parsed
          if (Array.isArray(result)) {
            items = result;
          } else if (typeof result === 'string') {
            // Try to parse the string result
            const parsed = JSON.parse(result);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } else {
            items = [result];
          }
        } catch (parseError) {
          console.warn('Template Loop Card: Could not parse template result:', result);
        }
      }

      // Validate items
      items = items.filter((item) => {
        if (typeof item === 'object' && item !== null && 'type' in item) {
          return true;
        }
        console.warn('Template Loop Card: Skipping invalid item (missing type):', item);
        return false;
      });

      return { items };
    } catch (error) {
      const errorMessage = this.errorHandler.handleTemplateError(error as Error, template);
      return {
        items: [],
        error: errorMessage,
      };
    }
  }
}
