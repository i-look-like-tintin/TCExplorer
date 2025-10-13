# TC Explorer User Guide

*Comprehensive guide for using the Tropical Cyclone Visualization Tool*

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Basic Navigation](#basic-navigation)
4. [Data Visualization Modes](#data-visualization-modes)
5. [Scenario Analysis](#scenario-analysis)
6. [Advanced Features](#advanced-features)
7. [Data Export](#data-export)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch
When you first open TC Explorer, you'll be greeted with an interactive tutorial that walks you through the main features. We recommend completing this tutorial to familiarize yourself with the interface.

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection for map tiles and data loading
- JavaScript enabled
- Minimum screen resolution: 1024x768 (mobile devices supported)

## Interface Overview

### Main Components

**Map Area**: The central visualization showing the Australian region with tropical cyclone tracks, genesis locations, and intensity data.

**Control Panel**: Located on the left side (desktop) or accessible via mobile controls, containing:
- Scenario selection
- Ensemble and SST model controls
- Year range sliders
- Visualization toggles
- Action buttons

**Legend**: Shows color coding for cyclone categories and other visual elements.

**Information Panel**: Displays detailed cyclone information when tracks are clicked.

### Mobile Interface
On mobile devices, controls are accessible through a floating action button (FAB) in the bottom-right corner. Tap to expand the control panel.

## Basic Navigation

### Map Controls
- **Pan**: Click and drag to move around the map
- **Zoom**: Use mouse wheel, pinch gestures, or zoom controls
- **Click Tracks**: Click on any cyclone track to view detailed information

### Control Panel
- **Desktop**: Panel is always visible on the left side
- **Collapsible**: Press Ctrl+P (Cmd+P on Mac) to hide/show controls
- **Mobile**: Access via the FAB menu in the bottom-right corner

## Data Visualization Modes

### 1. Track Visualization (Default)
Shows individual cyclone paths as colored lines based on intensity categories:
- **Blue**: Category 1
- **Green**: Category 2
- **Yellow**: Category 3
- **Orange**: Category 4
- **Red**: Category 5

**Controls:**
- Toggle track visibility with "Show Tracks"
- Filter pre-Category 1 tracks with "Show Pre-Cat 1"

### 2. Genesis Locations
Displays cyclone formation points as colored dots representing the maximum category reached.

**Controls:**
- Toggle with "Show Genesis"
- Genesis is defined as the first occurrence ≥ Category 1

### 3. Intensity Visualization
Shows cyclone tracks with color coding based on current storm intensity at each point.

**Controls:**
- Toggle with "Show Intensity"

### 4. Heatmap Mode
Displays cyclone density as a heat map showing frequency patterns across the region.

**Features:**
- Density calculations based on cyclone frequency
- Automatic color scaling
- Year controls are disabled in this mode

**Note:** Heatmap mode is not available when using scenario comparison.

## Scenario Analysis

### Climate Scenarios

**Current (1951-2011)**: Historical climate conditions
**NAT (1951-2010)**: Natural climate without anthropogenic warming
**2K (2031-2090)**: Climate projections with 2°C global warming
**4K (2051-2110)**: Climate projections with 4°C global warming

### Ensemble Members
Each scenario contains multiple ensemble members representing different model runs:
- Current & NAT: Up to 100 members
- 2K: 9 members (server IDs 101-109)
- 4K: 15 members (server IDs 101-115)

### SST Models
Available for future scenarios (2K, 4K):
- **CC**: Coupled Climate model
- **SST**: Sea Surface Temperature prescribed model

### Year Range Selection
Use the dual-range sliders to select specific time periods:
- Drag the left handle to set minimum year
- Drag the right handle to set maximum year
- The colored bar shows the selected range

## Advanced Features

### Scenario Comparison Mode

**Activation**: Toggle "Comparison Mode" in the control panel

**Features:**
- Side-by-side visualization of two scenarios
- Independent scenario, ensemble, and SST model selection
- Separate year range controls for each scenario
- Visibility toggles for each scenario
- Color-coded tracks (Scenario A: blue tones, Scenario B: red tones)

**Limitations:**
- Heatmap mode is disabled during comparison
- Some individual visualization modes may be limited

### Interactive Tutorial
Access the guided tutorial at any time:
- **Desktop**: Click "Tutorial" button in the control panel
- **Mobile**: Access through the FAB menu

### Data Filtering
- **Year Ranges**: Limit analysis to specific time periods
- **Pre-Category 1**: Include or exclude weaker systems
- **Scenario Visibility**: In comparison mode, toggle individual scenario visibility

## Data Export

### Export Options
Click the "Export Data" button to download currently displayed data as CSV format.

**Export Includes:**
- Cyclone metadata (ID, name, year, maximum category)
- Track points with coordinates, pressure, and wind speed
- Genesis and landfall information
- Current filter settings and year ranges

**File Naming:**
- Single mode: `tc_data_[scenario]_[ensemble]_[sst]_[year_range].csv`
- Comparison mode: `tc_comparison_[scenarioA]_vs_[scenarioB]_[date].csv`

### Data Structure
Exported CSV files contain the following columns:
- `cyclone_id`: Unique identifier
- `name`: Cyclone name (if assigned)
- `year`: Formation year
- `latitude`, `longitude`: Track coordinates
- `pressure`: Central pressure (hPa)
- `wind_speed`: Maximum sustained winds (km/h)
- `category`: Saffir-Simpson category
- `genesis_lat`, `genesis_lon`: Formation location
- `max_category`: Highest category reached
- `landfall`: Boolean indicating Australian landfall

## Troubleshooting

### Common Issues

**Slow Loading**
- Check internet connection
- Try refreshing the page
- Use the "Refresh Data" button to reload current dataset

**Map Not Displaying**
- Ensure JavaScript is enabled
- Check browser console for errors
- Try a different browser

**Controls Not Responsive**
- Wait for data loading to complete
- Check that the control panel is not collapsed
- On mobile, ensure the FAB menu is accessible

**Missing Data**
- Verify the selected scenario and ensemble combination
- Some ensemble members may not be available for all scenarios
- Check year range settings

### Performance Tips

**For Better Performance:**
- Limit year ranges when analyzing large datasets
- Use heatmap mode for overview analysis
- Close comparison mode when not needed
- Consider using ensemble subsets for initial exploration

### Browser Compatibility

**Recommended Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Known Issues:**
- Internet Explorer is not supported
- Some older mobile browsers may have limited functionality

## Support

For technical issues or questions about the application:
1. Check this user guide for solutions
2. Refer to the README.md for installation issues
3. Consult TECHNICAL_DOCS.md for development information

---

*TC Explorer v0.15.0 - Developed by Team Sharks*