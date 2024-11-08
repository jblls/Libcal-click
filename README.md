# What's On interactive website.

The client JS reads the JSON uploaded to the S3 bucket where the Webapp is hosted, <br/>
with an AWS Lambda, triggered every X hours. <br/>

The python script: <br/>
*/home/nfs/z3541612_sa/libcal/**libcal.py*** <br/> 
also uploades the JSON to this github repo using PyGithub.
The script is also located on my local WSL Linux: </br>
*/home/ste/Documents/libcal/**libcal.py*** </br>
and needs an access token generated from Settings > Developer Settings > Personal Access Tokens, with repo permissions. 




*checkForUpdates()* calls:

- *getEvents()* which calls *fetchEventData(filePath)* to load the JSON returning **eventData**.
- *displayEvents(newData, new Date())*
- *displayFooterEvents(newData)*
- *initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards)*
- *initializeDots(document.querySelector('#carousel-footer'), document.getElementById('carousel-indicators-footer')*
- *updateElementHeight('.footer-item', '#footer-events-container', visibleCards_footer);*
- *updateElementHeight('.card.mb-3.shadow-sm.bg-light.now-card', '#events-container', visibleCards);*

*displayMonthHeader()* and *displayWeek()* <br>
are called once, but displayWeek() has an addEventListener on click to check for change of day, to:
- remove highligths from day and add it to the clicked one:
- *displayEvents()*
- *clearDots(document.getElementById('carousel-indicators'));*
- *initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);*
- *updateElementHeight('.card.mb-3.shadow-sm.bg-light.now-card', '#events-container', visibleCards);*

*displayEvents(events, selectedDate)* calls:
- filter&sort function, 
- *createEventCard(event, selectedDate)*
- highlight cards happening status
- genQRCode

*displayFooterEvents(events)* calls:
- filter&sort function, 
- create footer-item cards with innerHTML
- genQRCode
- *initializeDots(cardContainer, indicatorsContainer, visibleCards)* <br>
adds the dots based on totalCards
- *updateDots(indicatorsContainer, currentStartIndex, visibleCards, totalCards)* <br>
highlight the current dot
- *updateCarousel(cardContainer, indicatorsContainer, currentStartIndex, visibleCards)* <br>
if (totalCards > visibleCards) calculate card+margin size and shift by currentStartIndex * totalHeight,
then call *updateDots()*