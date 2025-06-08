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
      // Use a promise-based approach to get the template result
      const templateResult = await new Promise<string>((resolve, reject) => {
        let unsubscribe: (() => void) | undefined;
        let resolved = false;

        const timeout = setTimeout(() => {
          if (unsubscribe) unsubscribe();
          if (!resolved) {
            resolved = true;
            reject(new Error('Template rendering timeout'));
          }
        }, 5000); // 5 second timeout

        // Create event handler for template results
        const handleTemplateResult = (event: any) => {
          if (event && event.result !== undefined && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (unsubscribe) unsubscribe();
            resolve(event.result);
          }
        };

        // Subscribe to template updates
        this.hass
          .callWS({
            type: 'render_template',
            template: template,
          })
          .then((unsub: any) => {
            unsubscribe = unsub;

            // If the unsub is actually a function that handles events, call it with our handler
            if (typeof unsub === 'function') {
              try {
                unsub(handleTemplateResult);
              } catch (e) {
                // If that doesn't work, the unsub might be the unsubscribe function
                console.log('Template Loop Card: Subscription established');
              }
            }
          })
          .catch((error) => {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              reject(error);
            }
          });
      });

      let items: TemplateItem[] = [];

      if (templateResult) {
        try {
          // Try to parse the string result as JSON first
          try {
            const parsed = JSON.parse(templateResult);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } catch (jsonError) {
            // If JSON parsing fails, try to parse as YAML-like structure
            items = this.parseYamlLikeTemplate(templateResult);
          }
        } catch (parseError) {
          console.warn('Template Loop Card: Could not parse template result:', templateResult);
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
}
