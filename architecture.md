# Tropical Cyclone Visualization - System Architecture

## Overview
This document describes the architecture of the Tropical Cyclone Visualization prototype and provides guidance for extending it into a full-featured application.

## Architecture Components

### Frontend (Client-Side)
- **Technology**: Vanilla JavaScript with Leaflet.js for mapping
- **Structure**: Object-oriented design with `TCVisualization` class
- **Communication**: RESTful API calls to PHP backend
- **Visualization**: Leaflet layers for tracks, genesis points, and intensity

### Backend (Server-Side)
- **Technology**: PHP 7.4+
- **API Design**: RESTful endpoints returning JSON
- **Data Processing**: Modular design for easy integration with NetCDF
- **Configuration**: Centralized config with environment overrides

### Data Layer
- **Current**: JSON files with simulated data
- **Future**: NetCDF files from dp4df dataset
- **Structure**: Hierarchical with metadata and ensemble support

## Key Design Patterns

### 1. Modular Data Processing
The API is designed to support multiple data sources:
```php
// Current: JSON files
processJsonData($jsonData, $scenario)

// Future: NetCDF files
processDp4dfData($filename, $scenario)
```

### 2. Layered Visualization
Frontend uses separate Leaflet layers for different features:
- Track layer: Cyclone paths
- Genesis layer: Starting points
- Intensity layer: Color-coded segments

### 3. Configuration-Driven
All settings centralized in `config.php`:
- Data paths
- API settings
- Map parameters
- Feature flags

## Data Flow

1. **User Interaction** → Frontend event handlers
2. **API Request** → `api.php?action=getCycloneData&scenario=2k`
3. **Data Processing** → PHP reads/processes data files
4. **JSON Response** → Structured cyclone data
5. **Visualization** → JavaScript renders on Leaflet map

## Extending the Application

### Adding NetCDF Support
1. Install PHP NetCDF extension or use exec() with ncdump
2. Implement `processDp4dfData()` in api.php
3. Map NetCDF variables to expected JSON structure

### Adding Database Support
1. Create MySQL/PostgreSQL schema:
```sql
CREATE TABLE cyclones (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50),
    year INT,
    scenario VARCHAR(10),
    ensemble_id INT,
    max_category INT,
    track_data JSON
);
```

2. Update API to query database instead of files
3. Implement data import scripts

### Adding Real-time Features
1. Implement WebSocket server for live updates
2. Add animation controls to frontend
3. Create time-series playback functionality

### Performance Optimization
1. **Caching Strategy**:
   - File-based caching for processed data
   - Browser caching for static assets
   - API response caching

2. **Data Optimization**:
   - Track simplification algorithm
   - Clustering for dense visualizations
   - Progressive loading for large datasets

3. **Frontend Optimization**:
   - Lazy loading of cyclone data
   - Canvas rendering for many tracks
   - Web Workers for data processing

## Security Considerations

### Current Implementation
- Input validation in API
- CORS configuration
- Protected configuration files
- XSS prevention headers

### Production Requirements
1. Add authentication system
2. Implement rate limiting
3. Use HTTPS everywhere
4. Sanitize all inputs
5. Add CSRF protection

## Scalability Path

### Phase 1: Current Prototype
- Single server deployment
- File-based data storage
- Simulated data

### Phase 2: Enhanced Version
- Database integration
- Real dp4df data processing
- Basic caching

### Phase 3: Production System
- Load-balanced architecture
- CDN for static assets
- Advanced caching (Redis)
- API versioning
- User authentication

## Integration Points

### UNSW Infrastructure
- Compatible with standard LAMP stack
- No special server requirements
- Standard PHP extensions

### External Data Sources
- dp4df NetCDF files
- CMIP6 datasets
- Observation data (IBTrACS)
- GIS shapefiles

### Future APIs
The modular design supports:
- GraphQL endpoint
- WebSocket connections
- REST API v2
- Batch processing endpoints

## Monitoring and Logging

### Current
- Basic error logging
- API access logs

### Recommended
- Application performance monitoring
- Error tracking (Sentry)
- Usage analytics
- Data quality metrics

## Development Workflow

### Local Development
1. Use XAMPP for local testing
2. Enable debug mode in config
3. Generate sample data
4. Test across browsers

### Deployment
1. Run setup script
2. Configure for production
3. Import real data
4. Monitor performance

## Conclusion
This architecture provides a solid foundation for the tropical cyclone visualization system. The modular design allows for incremental improvements while maintaining stability and performance.