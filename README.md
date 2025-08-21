# Tropical Cyclone Track Visualization Prototype
# Version 0.11.0
The app can be found running live in a web-facing environment at: https://tropicalcycloneexplorer.azurewebsites.net/

This is designed to be run through XAMPP, and then launched in the browser as localhost/YOUR_PROJECT_DIRECTORY_INSIDE_HTDOCS/index.html
Any issues with this, hit me up. The instructions below may not be super accurate, but I have implemented/tested it through Linux, Windows, and MacOS so happy to help you get it running if needed.
-May
## Update Notes:
- v0.10.0 Added experimental heatmap view, which utilises pre-processed cell data to draw the heatmap. This was created from Client's IPYNB code modified to pre-process data, and then uploaded into application through density_data/
See known issues with this experimental implementation.
- v0.11.0 Modularised JS for extendability, added support for mobile devices.

## Known Issues: 
- ~~Experimental heatmap mode is forcibly cleared on zooming, requires retoggling checkbox to reappear. Will investigate - may~~ Fixed.
- ~~Lat/long of precomputed data in experimental heatmap incorrectly formatted.~~ Fixed.
- Map glitches (jumps around) on panning. Investigating - may (Godzilla app.js was beautiful, and we killed him :c )
- QUERY: Determine whether experimental heatmap impacts loading of Tc Track data for unseen ensembles, as these use seperate data sources. Initial testing suggests no impact, but query further.

## May's Immediate Roadmap
- ~~Fix known experimental heatmap issues~~
- ~~Clean the project tree, seperate out app.js~~
- Genesis locations - Refine and include a much more accurate genesis location when cyclone speed reaching 34 knots (17m/s). Ignore path prior to genesis.
- Dissipation data points.
- Add a button to show land-fall locations. Display purely land-fall spots – no tracks. Be able to select the time. Have different coloured dots for land-fall location to show cyclone intensity upon landfall.
- ~~Add ability to select year ranges, rather than just all years or single year~~
- ~~Remove sample data functionality - no longer needed with data curl working~~
- ~~Fix heatmap display~~
- ~~Density and frequency maps. Include a unit converted to something / per year. Allows for experiment comparison – defined unit for everything~~
- ~~Clarify Client Notes with client~~
- ~~Update Density Heatmap in line with client's IPYNB~~
- ~~add azure support for prototype deployment~~

## Brady's work goals 
- Edit genisis dot
- Add mapping for other nations/regions
- Make it run on a phone???
- Hight Data 

## Other Needs:
- Validate data (I have only partially validated curled TC D4PDF data checking speeds and pressures - May)
- ~~Fix CSS display elements. Info boxes do not fit correctly on sub-1440p displays. Some control bar elements are misaligned.~~

## Client Notes:
- ~~Density and frequency maps. Include a unit converted to something / per year. Allows for experiment comparison – defined unit for everything.~~
-  Genesis locations - Refine and include a much more accurate genesis location when cyclone speed reaching 34 knots (17m/s). Ignore path prior to genesis. <-- In progress - Markey

- Checks to see how the genesis will change as the warming increases.  

- Historical period to show different member and what does it mean – to produce an overall pattern. Producing average locations.  

- Add a button to show ‘ensemble mean’  

- Add a button to show land-fall locations. Display purely land-fall spots – no tracks. Be able to select the time. Have different coloured dots for land-fall location to show cyclone intensity upon landfall.  <-- In progress - May 

- Intensity – highest intensity, filter by intensity levels.  

- Dissipation data points.  <-- In progress - May 

- Integrate one more layer using the BOM dataset – observations straight from BOM, will be supplied.  

- Zoom, and improve navigation, export function with longitude/latitude inputs to export a small region of data.  

- Add a historical period with no warming.  

- ~~Overall map with heat maps for complete historical data.~~  

- Need to implement longitude and latitude and implement tick boxes to divide the map into regions. Define the categories for each region's individual category classifications.  

## Overview
Project Aim:
This project will develop an interactive web-based platform to visualize and compare tropical cyclone tracks across multiple climate model simulations, ensemble members, and global warming levels (e.g., past, no warming, +1.5 K, +2 K, +4 K) based on the d4PDF large-ensemble dataset. The platform aims to:
- Aid climate research and student learning in climate dynamics and TC risk analysis.
- Visualize the spatial and temporal response of TC activity to anthropogenic warming.
- Provide a tool for educators, students, and climate policy analysts to explore model-based TC projections for the Australian region and the Indo-Pacific.
 
Expected Deliverables:
- A web-friendly dashboard.
- Interactive map layers of:
- TC tracks (by model, warming level, ensemble member, and period)
- Genesis points, landfall location, and intensity categories
- Time sliders to animate TC evolution and frequency over time.
- Clickable TC tracks to show metadata (e.g., date, intensity, pressure, wind speed).
- Scenario toggle buttons: e.g., Past Climate, Past no warming, +2 K future, +4 K future.
- Scenario difference toggle buttons: e.g., Past Climate, Past no warming, +2 K future, +4 K future.
- Data export functionality (e.g., filtered CSV download).
- A layer management panel (show/hide: genesis density, track density, intensity bins).

                        #
                       ###
                      #####
                     #######
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
      ####XXXXXXXXXXXXXX##XXXXXXXXXXXXXXXXXXXXXXXXX###XXXX##XXXXX###
      ##XX###############XXXXXXXXXXXXXXXXXXXXXXX###XXXXXX##XXXXXXXXXX##
      #######XXXXXXXXXXXXXXXXXXXXX###XXXXXXX##XXXXXXXXXXXXXXX###########
                ##XXXXXXXXXXXXXXXXXXXX###XXXXXXXX##XXXXXXXXXXXXXXXXXXX###
               ##XXXXXXXXXXXXXXXXXXX###XXXXXXXX#######XXXXXXXXXXXXXXXXXX###
              ##XXXXXXXXXXXXXXXX#####XXXXXXXX####################XXXXXXXXX###
             ##XXXXXXXXXXXXX#####XXXXXXXXX###                   ######XXXXXX#
             #XXXXXXXXXXX####XXXXXXXXXX####                          ######X#
            ##XXXXXXXXX###XXXXXXXXXX####           #                   #####
           ##XXXXXXXXX##XXXXXXXX#####             ###                   ###
           #XXXX#XXXX##XXXXXX####                #####                   #
          ##XXXXXXXX##XXXXX#####              ####XXX#
          #XXXXXXXXX#XXXX###XX#             ###XXXX##
          #XXXXXXXX##XX###XXXX#          ####XXXXXX#
          #XXXXXXXX#X######XXX#        ###XXXXXXXX##
          #XXXXXXXX#X#    #####      ###XXXXXXXXXX#
          #XXXXXXX###        ##    ###XXXXXXXXXXX##
          #XXXXXXX#X#         #  ###XXXXXXXXX#####
          #XXXXXXX###          ###XXXXXXX#####
          ##XXXXX#X##        ###XXXXXXX###
           #XXXXX####   #####XXXXXXXX##
           ##XXXXXX######XXXXXXXXXX###
           ###XXXXXXXXXXXXXXXXXXX###
           #X##XXXXXXXXXXXXXXXXX##
          ##X####XXXXXXXXXXXXXX##
          ####  ###XXXXXXXXXXX##
          ##      ###XXXXXXXX##
          #         #XXXXXXXX#
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
                                     #
