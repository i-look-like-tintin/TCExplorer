# TC Explorer Technical Documentation

*Developer guide for maintaining and extending the Tropical Cyclone Visualization Tool*

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Classes](#core-classes)
4. [Data Management](#data-management)
5. [Visualization System](#visualization-system)
6. [UI Components](#ui-components)
7. [Development Guidelines](#development-guidelines)
8. [Deployment](#deployment)
9. [API Reference](#api-reference)

## Architecture Overview

TC Explorer follows a modular, object-oriented architecture with clear separation of concerns:

```
TCVisualization (Main Controller)
├── MapManager (Leaflet.js integration)
├── DataManager (Data loading/caching)
├── VisualizationRenderer (Track/heatmap rendering)
├── UIController (Interface management)
├── DeviceManager (Responsive behavior)
├── TutorialManager (User onboarding)
└── TCUtils (Utility functions)
```

### Design Patterns
- **Module Pattern**: Each major component is encapsulated in its own class
- **Observer Pattern**: Event-driven UI updates
- **Strategy Pattern**: Different visualization modes
- **Facade Pattern**: Main controller simplifies complex interactions

## File Structure

```
TCExplorer/
├── index.html                 # Main application entry point
├── css/
│   └── styles.css            # Complete application styling
├── js/
│   ├── app.js                # Main application controller
│   ├── map-manager.js        # Map and layer management
│   ├── data-manager.js       # Data loading and caching
│   ├── visualization-renderer.js # Track and heatmap rendering
│   ├── ui-controller.js      # User interface management
│   ├── device-manager.js     # Mobile/responsive handling
│   ├── tutorial-manager.js   # Interactive tutorial system
│   └── utils.js              # Utility functions and helpers
├── data/                     # Cyclone track data (JSON)
├── density_data/             # Pre-processed heatmap data
├── images/                   # Application assets
├── README.md                 # Client documentation
├── USER_GUIDE.md            # End-user instructions
└── TECHNICAL_DOCS.md        # This file
```

## Core Classes

### TCVisualization (app.js)
**Purpose**: Main application controller and state manager

**Key Properties:**
```javascript
currentScenario: string        // Active climate scenario
currentEnsemble: number        // Active ensemble member
currentSSTModel: string        // SST model (for future scenarios)
comparisonMode: boolean        // Comparison mode state
cycloneData: object           // Cached cyclone datasets
yearRange: object             // Current year filter
```

**Key Methods:**
- `init()`: Initialize all subsystems
- `changeScenario(scenario)`: Switch climate scenarios
- `toggleComparisonMode(enabled)`: Enable/disable comparison
- `updateVisualization()`: Refresh map display
- `exportData()`: Generate CSV exports

### MapManager (map-manager.js)
**Purpose**: Leaflet.js integration and geographic operations

**Key Features:**
- Map initialization and configuration
- Layer management (tracks, genesis, intensity, heatmap)
- World wrapping for continuous panning
- Geographic utility functions

**Layer Structure:**
```javascript
layers: {
    tracks: L.layerGroup(),      // Cyclone track lines
    genesis: L.layerGroup(),     // Genesis point markers
    intensity: L.layerGroup(),   // Intensity-coded tracks
    heatmap: L.heatLayer()       // Density visualization
}
```

### DataManager (data-manager.js)
**Purpose**: Data loading, caching, and processing

**Caching Strategy:**
- Memory-based cache with scenario-specific keys
- Lazy loading for performance optimization
- Cache invalidation for data updates

**Data Processing:**
- Track filtering and categorization
- Genesis point calculation (≥Cat 1)
- Landfall detection for Australian region
- Coordinate normalization for world wrapping

### VisualizationRenderer (visualization-renderer.js)
**Purpose**: Map visualization generation

**Visualization Types:**
1. **Standard Tracks**: Category-based color coding
2. **Genesis Points**: Formation location markers
3. **Intensity Tracks**: Point-by-point intensity coloring
4. **Heatmaps**: Density-based visualization
5. **Comparison**: Dual-scenario overlays

**Color Schemes:**
```javascript
categoryColors: {
    1: '#3498db',  // Blue
    2: '#27ae60',  // Green
    3: '#f1c40f',  // Yellow
    4: '#e67e22',  // Orange
    5: '#e74c3c'   // Red
}
```

### UIController (ui-controller.js)
**Purpose**: User interface management and event handling

**Responsibilities:**
- Event listener setup and management
- Control panel state synchronization
- Year slider functionality
- Modal dialog management
- Responsive layout adjustments

### DeviceManager (device-manager.js)
**Purpose**: Device detection and responsive behavior

**Features:**
- Mobile/tablet/desktop detection
- Touch-specific optimizations
- Control panel adaptation
- Performance monitoring

## Data Management

### Data Sources
**Primary Data**: JSON files in `/data/` directory
- Format: One file per scenario/ensemble/SST combination
- Structure: Array of cyclone objects with track points

**Heatmap Data**: Pre-processed density data in `/density_data/`
- Format: Gridded density values
- Resolution: Configurable grid spacing

### Data Schema

**Cyclone Object:**
```javascript
{
    id: string,                    // Unique identifier
    name: string,                  // Named storms only
    year: number,                  // Formation year
    maxCategory: number,           // Highest category reached
    maxWind: number,              // Maximum wind speed (km/h)
    minPressure: number,          // Minimum central pressure (hPa)
    duration: number,             // Storm duration (days)
    genesis_lat: number,          // Formation latitude
    genesis_lon: number,          // Formation longitude
    landfall: boolean,            // Australian landfall flag
    track: [{                     // Track points array
        lat: number,              // Latitude
        lon: number,              // Longitude
        pressure: number,         // Central pressure
        wind: number,             // Wind speed
        category: number,         // Current category
        datetime: string          // ISO timestamp
    }]
}
```

### Caching Implementation
```javascript
getCacheKey() {
    return `${this.currentScenario}_${this.currentEnsemble}_${this.currentSSTModel}`;
}

async loadData(forceRefresh = false) {
    const cacheKey = this.getCacheKey();
    if (!forceRefresh && this.app.cycloneData[cacheKey]) {
        return this.app.cycloneData[cacheKey];
    }
    // Load and cache new data
}
```

## Visualization System

### Rendering Pipeline
1. **Data Filtering**: Apply year ranges and category filters
2. **Coordinate Processing**: Handle world wrapping and projections
3. **Layer Creation**: Generate appropriate Leaflet layers
4. **Style Application**: Apply colors and styling
5. **Map Integration**: Add to appropriate layer groups

### Performance Optimizations
- **Layer Virtualization**: Only render visible features
- **Coordinate Caching**: Pre-calculate wrapped coordinates
- **Debounced Updates**: Throttle rapid UI changes
- **Memory Management**: Clear unused layers promptly

### World Wrapping Implementation
```javascript
getVisibleWorldCopies() {
    const bounds = this.map.getBounds();
    const copies = [0]; // Primary world

    if (bounds.getWest() < -180) copies.push(-360);
    if (bounds.getEast() > 180) copies.push(360);

    return copies;
}
```

## UI Components

### Control Panel Architecture
- **Modular Design**: Each control group is self-contained
- **State Synchronization**: UI reflects current application state
- **Event Delegation**: Efficient event handling
- **Accessibility**: ARIA labels and keyboard support

### Year Range Sliders
**Implementation**: Custom dual-range slider with visual feedback
```javascript
updateSliderRange() {
    const minPercent = ((min - sliderMin) / (sliderMax - sliderMin)) * 100;
    const maxPercent = ((max - sliderMin) / (sliderMax - sliderMin)) * 100;

    sliderRange.style.left = `${minPercent}%`;
    sliderRange.style.width = `${maxPercent - minPercent}%`;
}
```

### Modal System
**Features:**
- Accessible modal dialogs
- Keyboard navigation (ESC to close)
- Click-outside-to-close functionality
- Focus management

### Responsive Design
**Breakpoints:**
- Mobile: ≤768px
- Tablet: 769px - 1024px
- Desktop: >1024px

**Adaptive Features:**
- Collapsible control panels
- Touch-optimized controls
- Flexible layouts
- Performance adjustments

## Development Guidelines

### Code Style
- **ES6+ Features**: Use modern JavaScript syntax
- **Consistent Naming**: camelCase for variables/functions, PascalCase for classes
- **Documentation**: JSDoc comments for public methods
- **Error Handling**: Comprehensive try-catch blocks

### Adding New Features

**1. New Visualization Mode:**
```javascript
// 1. Add toggle in HTML
<input type="checkbox" id="show-new-mode" />

// 2. Add event listener in UIController
setupVisualizationToggles() {
    document.getElementById('show-new-mode').addEventListener('change', async (e) => {
        await this.app.toggleVisualizationMode('newMode', e.target.checked);
    });
}

// 3. Implement rendering in VisualizationRenderer
async renderNewMode(cyclones) {
    // Implementation here
}
```

**2. New Data Source:**
```javascript
// 1. Update DataManager.getDataUrl()
getDataUrl() {
    // Add new URL pattern
}

// 2. Update caching key if needed
getCacheKey() {
    // Include new parameters
}

// 3. Update data processing if schema differs
processRawData(data) {
    // Handle new data format
}
```

### Testing Procedures
1. **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
2. **Device Testing**: Desktop, tablet, mobile
3. **Data Validation**: Verify exports and visualizations
4. **Performance Testing**: Monitor memory usage and render times
5. **Accessibility Testing**: Keyboard navigation and screen readers

### Performance Monitoring
```javascript
// Performance measurement example
const startTime = performance.now();
await this.renderVisualization();
const endTime = performance.now();
console.log(`Rendering took ${endTime - startTime} milliseconds`);
```

## Deployment

### Production Checklist
- [ ] Remove all console.log statements
- [ ] Minify CSS and JavaScript files
- [ ] Optimize images and assets
- [ ] Test all data URLs are accessible
- [ ] Verify cross-browser compatibility
- [ ] Test mobile responsiveness
- [ ] Validate exported data formats
- [ ] Check tutorial functionality

### Server Requirements
- **Web Server**: Apache, Nginx, or equivalent
- **SSL Certificate**: Recommended for production
- **CORS Headers**: May be required for data access
- **Compression**: Enable gzip for better performance

### Environment Configuration
**Development:**
```javascript
const CONFIG = {
    DEBUG: true,
    DATA_BASE_URL: './data/',
    CACHE_ENABLED: false
};
```

**Production:**
```javascript
const CONFIG = {
    DEBUG: false,
    DATA_BASE_URL: 'https://your-server.com/data/',
    CACHE_ENABLED: true
};
```

## API Reference

### Main Application API

**TCVisualization.getState()**
Returns current application state object

**TCVisualization.changeScenario(scenario)**
- `scenario`: 'current', 'nat', '2k', '4k'

**TCVisualization.toggleComparisonMode(enabled)**
- `enabled`: boolean

**TCVisualization.exportData()**
Triggers CSV export of current data

### Utility Functions

**TCUtils.showNotification(message, type, duration)**
- `message`: string
- `type`: 'info', 'success', 'warning', 'error'
- `duration`: milliseconds (optional)

**TCUtils.exportToCSV(data, filename)**
- `data`: cyclone data object
- `filename`: output filename

### Event System

**Custom Events:**
- `dataLoaded`: Fired when new data is loaded
- `visualizationUpdated`: Fired when map is updated
- `modeChanged`: Fired when visualization mode changes

## Troubleshooting

### Common Development Issues

**1. Data Not Loading**
- Check file paths and server configuration
- Verify CORS headers for external data sources
- Examine browser network tab for failed requests

**2. Memory Leaks**
- Ensure layers are properly cleared before creating new ones
- Remove event listeners when components are destroyed
- Monitor memory usage in browser dev tools

**3. Performance Issues**
- Profile rendering functions with browser dev tools
- Consider reducing data granularity for large datasets
- Implement virtualization for very large track collections

### Debug Tools

**Debug Mode:**
```javascript
// Enable debug logging
window.DEBUG = true;

// Access main application
window.tcApp.getState();

// Access individual managers
window.tcApp.mapManager
window.tcApp.dataManager
window.tcApp.visualizationRenderer
```

**Performance Monitoring:**
```javascript
// Monitor rendering performance
window.tcApp.visualizationRenderer.enableProfiling = true;

// Check cache status
console.log(window.tcApp.cycloneData);
```

## Version Control

### Git Workflow
1. Feature branches for new development
2. Pull requests for code review
3. Semantic versioning for releases
4. Tag releases for deployment tracking

### Release Process
1. Update version numbers in relevant files
2. Generate production builds
3. Test deployment on staging environment
4. Create release documentation
5. Deploy to production
6. Monitor for issues

---

*TC Explorer v0.15.0 - Technical Documentation*
*Developed by Team Sharks: May, Markey, Scott, Jackson, and Wheeler*