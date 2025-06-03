# Template Loop Card

[![HACS Badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/EnkodoNL/template-loop-card.svg)](https://github.com/EnkodoNL/template-loop-card/releases)
[![License](https://img.shields.io/github/license/EnkodoNL/template-loop-card.svg)](LICENSE)

A powerful Home Assistant custom card that dynamically loops over template-generated lists to create multiple cards without manual configuration.

Perfect for displaying dynamic content like:
- 📝 Todoist tasks and reminders
- 📅 Calendar events
- 🌡️ Sensor arrays (temperatures, batteries, etc.)
- 👥 Person locations
- 🛒 Shopping lists
- 📊 Any list-based data from Home Assistant

## ✨ Features

- **🔄 Dynamic Looping**: Process Jinja2 templates to generate lists of cards
- **🎯 Universal Card Support**: Works with all built-in Home Assistant card types plus custom cards
- **📐 Flexible Layouts**: Vertical, horizontal, and grid layouts with configurable spacing
- **🛡️ Error Handling**: Graceful error recovery with configurable fallback messages
- **🎨 Styling Support**: Full card-mod integration for custom styling
- **⚡ Performance**: Efficient rendering and updates
- **🔧 Easy Configuration**: Intuitive YAML configuration

## 🚀 Quick Start

### Installation via HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Frontend" section
3. Click the "+" button and search for "Template Loop Card"
4. Install the card
5. Restart Home Assistant
6. Add the card to your dashboard

### Manual Installation

1. Download `template-loop-card.js` from the [latest release](https://github.com/EnkodoNL/template-loop-card/releases)
2. Copy it to your `config/www/` folder
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/template-loop-card.js
    type: module
```

4. Restart Home Assistant

## 📖 Basic Usage

```yaml
type: custom:template-loop-card
template: >
  {% for item in state_attr('sensor.todoist_reminders', 'items') %}
    - type: markdown
      content: "**{{ item.content }}** - due: {{ item.due.date }}"
  {% endfor %}
```

## ⚙️ Configuration

| Option | Type | Default | Description |  
|--------|------|---------|-------------|
| `template` | string | **Required** | Jinja2 template that returns a list of card configurations |
| `layout` | string | `vertical` | Layout type: `vertical`, `horizontal`, or `grid` |
| `columns` | number | `2` | Number of columns for grid layout |
| `spacing` | string | `8px` | Gap between cards |
| `no_items_message` | string | `No items found` | Message shown when template returns no items |
| `show_errors` | boolean | `false` | Show detailed error messages in the UI |
| `card_mod` | object | - | Card-mod styling configuration |

## 📚 Examples

### 📝 Todoist Tasks

```yaml
type: custom:template-loop-card
template: >
  {% for task in state_attr('sensor.todoist_tasks', 'items') %}
    - type: markdown
      content: |
        **{{ task.content }}**
        {% if task.due %}📅 Due: {{ task.due.date }}{% endif %}
        ⭐ Priority: {{ task.priority }}
  {% endfor %}
layout: vertical
spacing: 12px
no_items_message: "All tasks completed! 🎉"
```

### 📅 Calendar Events

```yaml
type: custom:template-loop-card
template: >
  {% for event in state_attr('calendar.personal', 'events')[:5] %}
    - type: entities
      title: "📅 {{ event.summary }}"
      entities:
        - entity: input_datetime.dummy
          name: "🕐 {{ event.start.strftime('%H:%M') }}"
        - entity: input_text.dummy
          name: "📍 {{ event.location or 'No location' }}"
  {% endfor %}
```

### 🌡️ Temperature Sensors Grid

```yaml
type: custom:template-loop-card
template: >
  {% for sensor in states.sensor if 'temperature' in sensor.entity_id %}
    - type: button
      entity: "{{ sensor.entity_id }}"
      name: "{{ sensor.attributes.friendly_name }}"
      show_state: true
      icon: mdi:thermometer
  {% endfor %}
layout: grid
columns: 3
spacing: 8px
```

### 👥 Family Location Status

```yaml
type: custom:template-loop-card
template: >
  {% for person in states.person %}
    - type: markdown
      content: |
        {% if person.state == 'home' %}
        🏠 **{{ person.attributes.friendly_name }}** is home
        {% else %}
        🚗 **{{ person.attributes.friendly_name }}** is {{ person.state }}
        {% endif %}
  {% endfor %}
layout: horizontal
spacing: 16px
```

### 🛒 Shopping List

```yaml
type: custom:template-loop-card
template: >
  {% for item in state_attr('sensor.shopping_list', 'items') %}
    - type: markdown
      content: |
        {% if item.complete %}
        ✅ ~~{{ item.name }}~~
        {% else %}
        ⬜ {{ item.name }}
        {% endif %}
  {% endfor %}
no_items_message: "Shopping list is empty! 🛒"
```

### 🔋 Battery Status Monitor

```yaml
type: custom:template-loop-card
template: >
  {% for state in states if state.attributes.battery_level is defined and state.attributes.battery_level | int < 20 %}
    - type: button
      entity: "{{ state.entity_id }}"
      name: "{{ state.attributes.friendly_name }}"
      show_state: true
      icon: mdi:battery-low
  {% endfor %}
layout: grid
columns: 2
no_items_message: "All batteries are good! 🔋"
```

## 🎨 Advanced Styling

### Custom Styling with card-mod

```yaml
type: custom:template-loop-card
template: >
  {% for light in states.light if light.state == 'on' %}
    - type: button
      entity: "{{ light.entity_id }}"
      name: "{{ light.attributes.friendly_name }}"
      icon: mdi:lightbulb
  {% endfor %}
card_mod:
  style: |
    ha-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      border: none;
    }
    .template-loop-container {
      padding: 20px;
    }
    .template-loop-item {
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }
    .template-loop-item:hover {
      transform: scale(1);
    }
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/EnkodoNL/template-loop-card.git
cd template-loop-card

# Install dependencies
npm install

# Build the card
npm run build

# Watch for changes during development
npm run dev
```

### Project Structure

```
template-loop-card/
├── src/
│   ├── template-loop-card.ts      # Main card component
│   ├── template-processor.ts      # Template processing logic
│   ├── card-renderer.ts           # Card rendering engine
│   ├── error-handler.ts           # Error handling utilities
│   └── types.ts                   # TypeScript type definitions
├── dist/                          # Built files
├── hacs.json                      # HACS configuration
├── info.md                        # HACS store information
└── README.md                      # This file
```

## 🐛 Troubleshooting

### Template Errors

**Problem**: Template not working or showing errors

**Solutions**:
- Enable `show_errors: true` to see detailed error messages
- Test your template in Home Assistant's Developer Tools > Template
- Check the browser console for additional debugging information
- Ensure your template returns a valid list of card configurations

### Card Not Appearing

**Problem**: Card doesn't show up in the dashboard

**Solutions**:
- Verify the resource is added to your Lovelace configuration
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check that the card type is exactly `custom:template-loop-card`
- Restart Home Assistant after installation

### Performance Issues

**Problem**: Dashboard becomes slow with large lists

**Solutions**:
- Limit items in your template using slicing: `states.sensor[:10]`
- Use simpler card types (markdown instead of entities)
- Avoid complex calculations in templates
- Consider pagination for very large datasets

### Common Template Patterns

```yaml
# Limit number of items
{% for item in items[:5] %}

# Filter by condition
{% for sensor in states.sensor if sensor.state != 'unavailable' %}

# Sort by attribute
{% for item in items | sort(attribute='name') %}

# Group by category
{% for category, items in items | groupby('category') %}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 🐛 [Report Issues](https://github.com/EnkodoNL/template-loop-card/issues)
- 💬 [Community Forum](https://community.home-assistant.io/)
- 📖 [Documentation](https://github.com/EnkodoNL/template-loop-card/wiki)

---

⭐ If you find this card useful, please consider giving it a star on GitHub!