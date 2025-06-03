import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TemplateLoopCardConfig, HomeAssistant, CardHelpers } from './types';
import { TemplateProcessor } from './template-processor';
import { CardRenderer } from './card-renderer';
import { ErrorHandler } from './error-handler';

@customElement('template-loop-card')
export class TemplateLoopCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: TemplateLoopCardConfig;
  @state() private renderedContent?: HTMLElement;
  @state() private isLoading = false;
  @state() private error?: string;

  private templateProcessor?: TemplateProcessor;
  private cardRenderer?: CardRenderer;
  private errorHandler?: ErrorHandler;
  private helpers?: CardHelpers;

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .template-loop-container {
        padding: 16px;
      }

      .template-loop-item {
        margin: 0;
      }

      .template-loop-vertical {
        display: flex;
        flex-direction: column;
      }

      .template-loop-horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }

      .template-loop-grid {
        display: grid;
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 32px;
        color: var(--secondary-text-color);
      }

      .error {
        color: var(--error-color);
        padding: 16px;
        background: var(--error-color-background, rgba(255, 0, 0, 0.1));
        border-radius: 4px;
        margin: 8px;
      }

      .no-items {
        color: var(--secondary-text-color);
        text-align: center;
        padding: 32px;
        font-style: italic;
      }

      /* Card-mod support */
      :host([card-mod]) {
        /* Styles will be injected by card-mod */
      }
    `;
  }

  public setConfig(config: TemplateLoopCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (!config.template) {
      throw new Error('Template is required');
    }

    this.config = {
      layout: 'vertical',
      columns: 2,
      spacing: '8px',
      no_items_message: 'No items found',
      show_errors: false,
      ...config
    };

    this.errorHandler = new ErrorHandler(this.config.show_errors);
  }

  public getCardSize(): number {
    // Estimate card size based on content
    return this.renderedContent?.children.length || 1;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('hass')) {
      this.initializeProcessors();
      this.processTemplate();
      return true;
    }

    if (changedProps.has('config')) {
      this.processTemplate();
      return true;
    }

    return changedProps.has('renderedContent') || 
           changedProps.has('isLoading') || 
           changedProps.has('error');
  }

  private initializeProcessors(): void {
    if (!this.hass || !this.errorHandler) return;

    this.templateProcessor = new TemplateProcessor(this.hass, this.errorHandler);
    this.cardRenderer = new CardRenderer(this.hass, this.errorHandler, this.helpers);
  }

  private async processTemplate(): Promise<void> {
    if (!this.templateProcessor || !this.cardRenderer || !this.config) {
      return;
    }

    this.isLoading = true;
    this.error = undefined;

    try {
      const result = await this.templateProcessor.processTemplate(this.config.template);
      
      if (result.error) {
        this.error = result.error;
        this.renderedContent = undefined;
      } else if (result.items.length === 0) {
        // Create a "no items" card
        const noItemsCard = this.errorHandler!.createNoItemsCard(this.config.no_items_message!);
        this.renderedContent = await this.cardRenderer.renderCards([noItemsCard], this.config.layout);
      } else {
        this.renderedContent = await this.cardRenderer.renderCards(
          result.items,
          this.config.layout,
          this.config.columns,
          this.config.spacing
        );
      }
    } catch (error) {
      this.error = this.errorHandler!.handleTemplateError(error as Error, this.config.template);
      this.renderedContent = undefined;
    } finally {
      this.isLoading = false;
    }
  }

  protected render() {
    if (this.isLoading) {
      return html`
        <ha-card>
          <div class="loading">
            <ha-circular-progress active></ha-circular-progress>
            <span>Processing template...</span>
          </div>
        </ha-card>
      `;
    }

    if (this.error) {
      return html`
        <ha-card>
          <div class="error">
            ${this.error}
          </div>
        </ha-card>
      `;
    }

    if (!this.renderedContent) {
      return html`
        <ha-card>
          <div class="no-items">
            ${this.config?.no_items_message || 'No content to display'}
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        ${this.renderedContent}
      </ha-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    // Apply card-mod styles if present
    if (this.config?.card_mod?.style) {
      this.applyCardModStyles(this.config.card_mod.style);
    }
  }

  private applyCardModStyles(styles: string): void {
    try {
      // Create or update style element
      let styleElement = this.shadowRoot?.querySelector('#card-mod-style') as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'card-mod-style';
        this.shadowRoot?.appendChild(styleElement);
      }

      styleElement.textContent = styles;
    } catch (error) {
      console.warn('Template Loop Card: Failed to apply card-mod styles:', error);
    }
  }

  // Static method to register the card with Home Assistant
  public static async getConfigElement() {
    // Return a config element for the UI editor (optional)
    return document.createElement('template-loop-card-editor');
  }

  public static getStubConfig() {
    return {
      type: 'custom:template-loop-card',
      template: `{% for state in states.sensor %}
  - type: markdown
    content: "**{{ state.attributes.friendly_name }}**: {{ state.state }}"
{% endfor %}`
    };
  }
}

// Register the card with Home Assistant
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'template-loop-card',
  name: 'Template Loop Card',
  description: 'A card that loops over template-generated lists',
  preview: true,
  documentationURL: 'https://github.com/EnkodoNL/template-loop-card'
});

// Also register for HACS
declare global {
  interface HTMLElementTagNameMap {
    'template-loop-card': TemplateLoopCard;
  }
}