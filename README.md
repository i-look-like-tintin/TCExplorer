# Tropical Cyclone Track Visualization Prototype
# Version 0.17.0
The app can be found running live in a web-facing environment at: https://tropicalcycloneexplorer.azurewebsites.net/

This is designed to be run through XAMPP, and then launched in the browser as localhost/YOUR_PROJECT_DIRECTORY_INSIDE_HTDOCS/index.html
Any issues with this, hit me up. The instructions below may not be super accurate, but I have implemented/tested it through Linux, Windows, and MacOS so happy to help you get it running if needed.
-May
## Update Notes:
- v0.10.0 Added experimental heatmap view, which utilises pre-processed cell data to draw the heatmap. This was created from Client's IPYNB code modified to pre-process data, and then uploaded into application through density_data/
See known issues with this experimental implementation.
- v0.11.0 Modularised JS for extendability, added support for mobile devices.
- v0.12.0 Added cool shark favicon. Arguably not deserving of a full number bump, but it *is* a really cool shark.
- v0.13.0 Added support for the long-awaited 'HPB_NAT' scenario. This is historical data with natural warming still included. Also re-styled control group to allow for extra buttons to be added without display nastiness.
- v0.14.0 Added scenario comparison functionality. Now different scenarios can be compared in terms of tracks and genesis locations. Also removed old heatmap visualisation, and removed the "Filter to Aus" toggle as I have deemed it no longer necessary lol
- v0.14.5 Genesis locations modified to first occurence >= Cat 1 (previously just first data point). This can be toggled with the relevant button. Loading text also fixed to correctly display loaded cache data. Assorted styling improved.
- v0.15.0 Added collapsible control panel to desktop mode as well. This allows app to facilitate lower resolution displays much more effectively.
- v0.15.5 Mobile version of site updated for functionality. Now functions horizontally and vertically, with a hamburger options menu allowing elements to be disabled for visibility and functions to be selected. Additional testing required to ensure full functionality.
- v0.16.0 Added individual year sliders and visibility toggles to scenario comparison. Investigating a potential issue with mobile display (full header showing in horizontal view).
- v0.17.0 Add full user tutorial for both desktop and mobile. Tutorial is configured to launch automatically for first-time users, and also be toggleable with a header option. 

## Known Issues: 
- ~~Experimental heatmap mode is forcibly cleared on zooming, requires retoggling checkbox to reappear. Will investigate - may~~ Fixed.
- ~~Lat/long of precomputed data in experimental heatmap incorrectly formatted.~~ Fixed.
- ~~Map glitches (jumps around) on panning. Investigating - May (Godzilla app.js was beautiful, and we killed him :c ) ((Hmm, it's server side, not a file issue. Doesn't exist in XAMPP) (Also doesn't seem to exist with chromium-based browsers))~~ Fixed. 
- ~~QUERY: Determine whether experimental heatmap impacts loading of Tc Track data for unseen ensembles, as these use seperate data sources. Initial testing suggests no impact, but query further.~~ Nup, I'm happy with.
- ~~Mobile app no longer functions correctly. Control toggles not switching between desktop to mobile.~~ Fixed, I fat-fingered lol
- ~~QUERY: Sweeping changes have been made to the application in version ~~0.13.0~~ 0.14.0, by a tired developer who didn't bother to thoroughly test. Things may go wrong. If things do go wrong, feel free to yell at developer.~~
- Mobile view does not handle rotation to landscape correctly. As of 0.14.0, mobile view now requires further updates to remain functional with scenario comparison.
- ~~Intensity colours option is super duper unperformant. I will look at fixing at some point.~~ Fixed.
-  Certain info boxes are not clearing when views are switched. For example, intensity categories and scenario comparison info both persist when switching to heatmap.
-  Heatmap option should be greyed out when in comparison view, or some form of heatmap comparison added?

## Immediate Roadmap
- Split year range sliders for scenario comparison needed
- Toggles to hide a scenario in scenario comparison mode
- Landfall locations (this is a WIP, its harder than it should be)
- ~~Fix known experimental heatmap issues~~
- ~~Clean the project tree, seperate out app.js~~
- ~~Genesis locations - Refine and include a much more accurate genesis location when cyclone speed reaching 34 knots (17m/s). Ignore path prior to genesis. (Markey working on)~~
- ~~Add ability to select year ranges, rather than just all years or single year~~
- ~~Remove sample data functionality - no longer needed with data curl working~~
- ~~Fix heatmap display~~
- ~~Density and frequency maps. Include a unit converted to something / per year. Allows for experiment comparison – defined unit for everything~~
- ~~Clarify Client Notes with client~~
- ~~Update Density Heatmap in line with client's IPYNB~~
- ~~add azure support for prototype deployment~~

## Other Needs:
- ~~Validate data (I have only partially validated curled TC D4PDF data checking speeds and pressures - May)~~ Na, happy with.
- ~~Fix CSS display elements. Info boxes do not fit correctly on sub-1440p displays. Some control bar elements are misaligned.~~

## Client Notes:
- ~~Density and frequency maps. Include a unit converted to something / per year. Allows for experiment comparison – defined unit for everything.~~
-  ~~Genesis locations - Refine and include a much more accurate genesis location when cyclone speed reaching 34 knots (17m/s). Ignore path prior to genesis. <-- In progress - Markey~~

- ~~Checks to see how the genesis will change as the warming increases.~~

- ~~Historical period to show different member and what does it mean – to produce an overall pattern. Producing average locations.~~  

- Split year range sliders for scenario comparison needed
- Toggles to hide a scenario in scenario comparison mode
- Landfall locations (this is a WIP, its harder than it should be)


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
