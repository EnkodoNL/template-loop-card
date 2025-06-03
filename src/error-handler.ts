export class ErrorHandler {
  private showErrors: boolean;

  constructor(showErrors: boolean = false) {
    this.showErrors = showErrors;
  }

  handleTemplateError(error: Error, template: string): string {
    const errorMessage = `Template processing failed: ${error.message}`;
    
    console.error('Template Loop Card Error:', {
      error: errorMessage,
      template: template.substring(0, 100) + (template.length > 100 ? '...' : ''),
      stack: error.stack
    });

    if (this.showErrors) {
      return errorMessage;
    }

    return '';
  }

  handleCardCreationError(error: Error, cardConfig: any): string {
    const errorMessage = `Card creation failed: ${error.message}`;
    
    console.error('Template Loop Card - Card Creation Error:', {
      error: errorMessage,
      cardConfig,
      stack: error.stack
    });

    if (this.showErrors) {
      return errorMessage;
    }

    return '';
  }

  createErrorCard(message: string): any {
    return {
      type: 'markdown',
      content: `⚠️ **Error**: ${message}`
    };
  }

  createNoItemsCard(message: string): any {
    return {
      type: 'markdown',
      content: message || 'No items found'
    };
  }
}