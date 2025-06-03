import { HomeAssistant, TemplateItem, CardHelpers } from './types';
import { ErrorHandler } from './error-handler';

export class CardRenderer {
  private hass: HomeAssistant;
  private errorHandler: ErrorHandler;
  private helpers?: CardHelpers;

  constructor(hass: HomeAssistant, errorHandler: ErrorHandler, helpers?: CardHelpers) {
    this.hass = hass;
    this.errorHandler = errorHandler;
    this.helpers = helpers;
  }

  setHelpers(helpers: CardHelpers) {
    this.helpers = helpers;
  }

  async renderCards(items: TemplateItem[], layout: string = 'vertical', columns?: number, spacing?: string): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = `template-loop-container template-loop-${layout}`;
    
    // Apply layout-specific styles
    this.applyLayoutStyles(container, layout, columns, spacing);

    // Create cards for each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const cardElement = await this.createCardElement(item);
        if (cardElement) {
          const wrapper = document.createElement('div');
          wrapper.className = 'template-loop-item';
          wrapper.appendChild(cardElement);
          container.appendChild(wrapper);
        }
      } catch (error) {
        const errorMessage = this.errorHandler.handleCardCreationError(error as Error, item);
        if (errorMessage) {
          const errorCard = await this.createCardElement(this.errorHandler.createErrorCard(errorMessage));
          if (errorCard) {
            container.appendChild(errorCard);
          }
        }
      }
    }

    return container;
  }

  private async createCardElement(config: any): Promise<HTMLElement | null> {
    try {
      // If we have card helpers, use them
      if (this.helpers) {
        const card = this.helpers.createCardElement(config);
        if (card && card.setConfig) {
          card.setConfig(config);
        }
        if (card && 'hass' in card) {
          (card as any).hass = this.hass;
        }
        return card as HTMLElement;
      }

      // Fallback: create card manually
      return await this.createCardManually(config);
    } catch (error) {
      console.error('Template Loop Card: Failed to create card element:', error);
      return null;
    }
  }

  private async createCardManually(config: any): Promise<HTMLElement | null> {
    const cardType = config.type;
    
    // Handle built-in card types
    switch (cardType) {
      case 'markdown':
        return this.createMarkdownCard(config);
      case 'entities':
        return this.createEntitiesCard(config);
      case 'button':
        return this.createButtonCard(config);
      case 'picture':
        return this.createPictureCard(config);
      default:
        // Try to create custom card
        return await this.createCustomCard(config);
    }
  }

  private createMarkdownCard(config: any): HTMLElement {
    const card = document.createElement('ha-card');
    card.className = 'markdown-card';
    
    const content = document.createElement('ha-markdown');
    content.setAttribute('content', config.content || '');
    content.setAttribute('allow-svg', 'true');
    
    card.appendChild(content);
    return card;
  }

  private createEntitiesCard(config: any): HTMLElement {
    const card = document.createElement('ha-card');
    card.className = 'entities-card';
    
    if (config.title) {
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = config.title;
      card.appendChild(header);
    }

    const content = document.createElement('div');
    content.className = 'card-content';
    
    if (config.entities && Array.isArray(config.entities)) {
      config.entities.forEach((entityConfig: any) => {
        const entityRow = this.createEntityRow(entityConfig);
        content.appendChild(entityRow);
      });
    }
    
    card.appendChild(content);
    return card;
  }

  private createEntityRow(entityConfig: any): HTMLElement {
    const row = document.createElement('div');
    row.className = 'entity-row';
    
    const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
    const name = entityConfig.name || entityId;
    
    const nameElement = document.createElement('div');
    nameElement.className = 'entity-name';
    nameElement.textContent = name;
    
    const stateElement = document.createElement('div');
    stateElement.className = 'entity-state';
    
    if (this.hass.states[entityId]) {
      stateElement.textContent = this.hass.states[entityId].state;
    } else {
      stateElement.textContent = 'unavailable';
    }
    
    row.appendChild(nameElement);
    row.appendChild(stateElement);
    
    return row;
  }

  private createButtonCard(config: any): HTMLElement {
    const card = document.createElement('ha-card');
    card.className = 'button-card';
    
    const button = document.createElement('mwc-button');
    button.textContent = config.name || config.entity || 'Button';
    
    if (config.entity) {
      button.addEventListener('click', () => {
        this.hass.callService('homeassistant', 'toggle', {
          entity_id: config.entity
        });
      });
    }
    
    card.appendChild(button);
    return card;
  }

  private createPictureCard(config: any): HTMLElement {
    const card = document.createElement('ha-card');
    card.className = 'picture-card';
    
    const img = document.createElement('img');
    img.src = config.image || '';
    img.alt = config.alt || '';
    
    card.appendChild(img);
    return card;
  }

  private async createCustomCard(config: any): Promise<HTMLElement | null> {
    try {
      const cardType = config.type;
      
      // Try to get the custom element
      const customElement = document.createElement(cardType);
      
      if (customElement && 'setConfig' in customElement) {
        (customElement as any).setConfig(config);
      }
      
      if (customElement && 'hass' in customElement) {
        (customElement as any).hass = this.hass;
      }
      
      return customElement;
    } catch (error) {
      console.warn(`Template Loop Card: Could not create custom card of type ${config.type}:`, error);
      
      // Fallback to markdown card with error message
      return this.createMarkdownCard({
        content: `⚠️ Unknown card type: ${config.type}`
      });
    }
  }

  private applyLayoutStyles(container: HTMLElement, layout: string, columns?: number, spacing?: string) {
    const spacingValue = spacing || '8px';
    
    switch (layout) {
      case 'horizontal':
        container.style.display = 'flex';
        container.style.flexDirection = 'row';
        container.style.gap = spacingValue;
        container.style.flexWrap = 'wrap';
        break;
        
      case 'grid':
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${columns || 2}, 1fr)`;
        container.style.gap = spacingValue;
        break;
        
      case 'vertical':
      default:
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = spacingValue;
        break;
    }
  }
}