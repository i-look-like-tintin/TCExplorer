# Tropical Cyclone Track Visualization Prototype
# Version 0.7.0
This is a very, very barebones prototype / Proof of Concept. It is designed to be run through XAMPP, and then launched in the browser as localhost/YOUR_PROJECT_DIRECTORY_INSIDE_HTDOCS/index.html
Any issues with this, hit me up. The instructions below may not be super accurate, but I have implemented/tested it through Linux, Windows, and MacOS so happy to help you get it running if needed.
-Mackenzie



## May's Immediate (<10 days) Roadmap
- ~~Add heatmap function to map dashboard~~
- Add ability to select year ranges, rather than just all years or single year
- Actually read the task sheet and figure out what else the client needs lmao
- Add additional data to TC selection pop-up
- ~~Add quick summary datapage to summarise differences against "baseline" <- we don't /really/ have a baseline but fuck it we ball~~
- Remove sample data functionality - no longer needed with data curl working
- probs some other things maybe


## Overview
This prototype provides an interactive web-based platform to visualize tropical cyclone tracks across different climate scenarios based on the dp4PDF dataset. The application allows users to compare cyclone activity under current conditions, +2K warming, and +4K warming scenarios.






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
