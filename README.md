# Tropical Cyclone Track Visualization Prototype
# Version 0.6.1
This is a very, very barebones prototype / Proof of Concept. It is designed to be run through XAMPP, and then launched in the browser as localhost/YOUR_PROJECT_DIRECTORY_INSIDE_HTDOCS/index.html
Any issues with this, hit me up. The instructions below may not be super accurate, but I have implemented it through Linux, Windows, and MacOS so happy to help you get it running if needed.
-Mackenzie

PS. Also, for the love of god, I need to update the directory structure. I am refusing to deal with another single-directory mess of a project again lmao. I have learned my lessons. 
PPS. No, no I haven't.

## Overview
This prototype provides an interactive web-based platform to visualize tropical cyclone tracks across different climate scenarios based on the dp4PDF dataset. The application allows users to compare cyclone activity under current conditions, +2K warming, and +4K warming scenarios.

## Project Structure
```
cyclone-visualization/
├── index.html          # Main frontend interface
├── app.js             # Frontend JavaScript application
├── styles.css         # Application styling
├── api.php            # Backend PHP API
├── config.php         # Main configuration file
├── config.local.php   # Local overrides (created by setup)
├── setup.php          # Setup script
├── generate_sample_data.php  # Sample data generator
├── .htaccess          # Apache configuration
├── data/              # Directory for dp4df data files
├── cache/             # Cache directory
├── logs/              # Log directory
└── README.md          # This file
```

## Setup Instructions

### Prerequisites
- XAMPP (or similar LAMP/WAMP stack) with PHP 7.4+
- Modern web browser with JavaScript enabled
- NetCDF support for PHP (optional, for actual data processing)

### Installation
1. Clone/copy the project files to your XAMPP htdocs directory:
   ```bash
   cd C:\xampp\htdocs\
   git clone [repository] cyclone-visualization
   # or manually copy files to:
   # C:\xampp\htdocs\cyclone-visualization\
   ```

2. Navigate to the project directory:
   ```bash
   cd cyclone-visualization
   ```

3. Run the setup script:
   ```bash
   php setup.php
   ```
   
   The setup script will:
   - Check PHP version and extensions
   - Create required directories
   - Generate a local configuration file
   - Optionally generate sample data
   - Test the API endpoint

4. Ensure XAMPP Apache service is running

5. Access the application at:
   ```
   http://localhost/cyclone-visualization/
   ```

## Current Features

### Frontend
- Interactive map centered on Australia using Leaflet.js
- Toggle between climate scenarios (Current, +2K, +4K)
- Display options for tracks, genesis points, and intensity colors
- Time slider for temporal filtering
- Cyclone information popup on track click
- CSV data export functionality
- Responsive design

### Backend
- PHP API with modular structure
- Simulated cyclone data generation (placeholder for real data)
- Scenario-based data filtering
- JSON response format

## Integrating Real dp4df Data

### Data Format Requirements
The application expects cyclone track data in the following structure:
```json
{
  "id": "TC_2020_001",
  "name": "Cyclone Name",
  "year": 2020,
  "maxCategory": 3,
  "maxWind": 185,
  "minPressure": 945,
  "duration": 7,
  "landfall": true,
  "track": [
    {
      "lat": -12.5,
      "lon": 135.2,
      "date": "2020-01-15",
      "category": 1,
      "windSpeed": 95,
      "pressure": 985
    }
  ]
}
```

### Sample Data Format
The sample data generator creates JSON files with this structure:
```json
{
  "metadata": {
    "scenario": "current",
    "time_period": "1990-2020",
    "ensemble_members": 100,
    "bounds": {...}
  },
  "ensemble_data": [
    {
      "ensemble_id": 1,
      "cyclones": [...]
    }
  ]
}
```

### Processing NetCDF Data
To integrate actual dp4df NetCDF files:

1. Install PHP NetCDF extension or use system calls to `ncdump`

2. Modify the `processDp4dfData()` function in `api.php`:
```php
private function processDp4dfData($filename, $scenario) {
    // Read NetCDF file
    $ncData = exec("ncdump -v track_lat,track_lon,wind_speed $filename");
    
    // Parse and format data
    // Extract cyclone tracks
    // Return formatted array
}
```

3. Place dp4df files in the `data/` directory with naming convention:
   - `dp4df_historical_tracks.nc`
   - `dp4df_2k_warming_tracks.nc`
   - `dp4df_4k_warming_tracks.nc`

## Extending the Application

### Adding New Features
1. **Ensemble Member Selection**: Add UI controls and modify API to filter by ensemble member
2. **Advanced Statistics**: Implement track density calculations and heatmaps
3. **Animation**: Add play/pause controls for temporal animation
4. **Region Filtering**: Add polygon selection tool for spatial filtering

### Performance Optimization
- Implement data caching in PHP
- Use database storage for processed tracks
- Add pagination for large datasets
- Implement WebGL rendering for thousands of tracks

### API Endpoints
Current endpoints:
- `GET api.php?action=getCycloneData&scenario={current|2k|4k}`
- `GET api.php?action=getScenarioMetadata&scenario={current|2k|4k}`

Future endpoints to implement:
- `GET api.php?action=getTrackDensity&scenario={scenario}&bounds={bounds}`
- `GET api.php?action=getEnsembleMembers&scenario={scenario}`
- `GET api.php?action=getCycloneDetails&id={cyclone_id}`

## Deployment to UNSW Infrastructure

### Requirements Check
- PHP 7.4+ with JSON support
- Apache with .htaccess support
- CORS headers configured
- NetCDF libraries (for data processing)

### Security Considerations
- Add input validation in API
- Implement rate limiting
- Use prepared statements if database is added
- Sanitize all user inputs

### Performance Tuning
- Enable PHP OPcache
- Configure Apache caching headers
- Minify CSS/JS for production
- Use CDN for Leaflet resources

## Troubleshooting

### Common Issues
1. **Map not loading**: Check internet connection for tile server access
2. **No data displayed**: Verify API endpoint is accessible
3. **CORS errors**: Ensure proper headers in api.php

### Debug Mode
Add `?debug=true` to URL for console logging

## Future Enhancements
- Integration with additional datasets (CMIP6, observations)
- Machine learning for track prediction
- Mobile app version
- Real-time data updates
- Multi-language support





                    #########
                    ##XXXX#XX####                    #########
                    ###############          #####################
                      ###XXXXXXXXX### ########XXXXXXXXXXXXXXXXXX##
                        #X#XXXXXXX#X#####XX#XXXXXXX XXXXXXX XX###
                         #XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX###
                         ##XXXXXXXXX##XXXXXXXXXXXXXXXXXXXXXXXXX##
                          #XXXXXXXX##XXXXXXXXXXXXXXXXXXXXXXXXX###
                          ##XXXX###XXXXXXXXXXXXXXXXXXXXXXXX#####
                        ####XXX##XXXXXXXXXXXXXXXXXXXXXXX#######
                       ##X##XX#XXXXXXXXXXXXXXXXXXXXXXXX#######
                  #####XXX#XXXXXXXXXXXXXXXXXXXXXXXX##########
         ##########X##XXXXXXXXXXXXXXXXXXXXXXXXXXX###XXX#####
      #######XXXXXXXXX##XXXXXXXXXXXXXXXXXXXXXXXXXX###XXX#######
      ####XXXXXXXXXXXXXX##XXXXXXXXXXXXXXXXXXXXXXXXX###XXXX##XXXXX#####
      ##XX###############XXXXXXXXXXXXXXXXXXXXXXX###XXXXXX##XXXXXXXXXX#####
      #######XXXXXXXXXXXXXXXXXXXXX###XXXXXXX##XXXXXXXXXXXXXXX###
                ##XXXXXXXXXXXXXXXXXXXX###XXXXXXXX##XXXXXXXXXXXXXXXXXXX###
               ##XXXXXXXXXXXXXXXXXXX###XXXXXXXX#######XXXXXXXXXXXXXXXXXX###
              ##XXXXXXXXXXXXXXXX#####XXXXXXXX###     ############XXXXXXXXX###
             ##XXXXXXXXXXXXX#####XXXXXXXXX###                   ######XXXXXX#
             #XXXXXXXXXXX####XXXXXXXXXX####                          ######X#
            ##XXXXXXXXX###XXXXXXXXXX####                                  ###
           ##XXXXXXXXX##XXXXXXXX#####
           #XXXX#XXXX##XXXXXX####                #####
          ##XXXXXXXX##XXXXX#####              ####XXX#
          #XXXXXXXXX#XXXX###XX#             ###XXXX##
          #XXXXXXXX##XX###XXXX#          ####XXXXXX#
          #XXXXXXXX#X######XXX#        ###XXXXXXXX##
          #XXXXXXXX#X#    #####      ###XXXXXXXXXX#
          #XXXXXXX###        ##    ###XXXXXXXXXXX##
          #XXXXXXX#X#            ###XXXXXXXXX#####
          #XXXXXXX###          ###XXXXXXX#####
          ##XXXXX#X##        ###XXXXXXX###
           #XXXXX####   #####XXXXXXXX##
           ##XXXXXX######XXXXXXXXXX###
           ###XXXXXXXXXXXXXXXXXXX###
           #X##XXXXXXXXXXXXXXXXX##
          ##X####XXXXXXXXXXXXXX##
          ####  ###XXXXXXXXXXX##
          ##      ###XXXXXXXX##
                    #XXXXXXXX#
                     #XXXXXX##
                     #XXXXXX#
                     ##XXXXX#
                      #XXXXX#
                      #XXXXX#
                       #XXXX#
                       ##XXX#
                        #XXXX#
                        ##XXX#
                         ##XX##
                          ##XX##
                           ##XX#
                            ##XX##
                             ##XX##
                              ###X##
                                #####
                                  #####
                                    ###
