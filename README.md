# What's On interactive website.

The client JS reads the JSON uploaded to the S3 bucket (where the Webapp is hosted) <br/>
with an AWS Lambda, triggered every X hours. <br/>

The python script: <br/>
*/home/ste/Documents/libcal/libcal.py* <br/> 
also uploades the JSON to this github repo using PyGithub.</br>
It needs an access token generated from Settings > Developer Settings > Personal Access Tokens, with repo permissions. 




`firstLoad()` calls:

1. `getEvents()` which calls 
    - `fetchEventData(filePath)` to load the JSON returning **eventData**.
2. `displayEvents(newData, new Date())`
3. `displayFooterEvents(newData)`
4. `initializeDots()` main and footer,
6. `updateElementHeight()` main and footer.

`checkForUpdates()` calls:

1. `getEvents()` which calls 
    - `fetchEventData(filePath)` to load the JSON returning **eventData**.
    
    if JSON is different, then these are called:
    1. `displayEvents(newData, new Date())`
    2. `displayFooterEvents(newData)`
    3. `initializeDots()` main and footer,


`displayMonthHeader()` and `displayWeek()` <br>
are called once at the beginning of `init()`, <br>
but `displayWeek()` has an addEventListener on click, to check for change of day, to:
1. remove highligths from day and add it to the clicked one:
2. `displayEvents()`
3. `clearDots(document.getElementById('carousel-indicators'));`
4. `initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);`
5. `updateElementHeight('.card.mb-3.shadow-sm.bg-light.now-card', '#events-container', visibleCards);`

`displayEvents(events, selectedDate)` calls:
1. filter&sort function, 
2. `createEventCard(event, selectedDate)`
3. highlight cards happening status
4. genQRCode

`displayFooterEvents(events)` calls:
1. filter&sort function, 
2. create footer-item cards with innerHTML
3. genQRCode
4. `initializeDots(cardContainer, indicatorsContainer, visibleCards)` <br>
adds the dots based on totalCards
5. `updateDots(indicatorsContainer, currentStartIndex, visibleCards, totalCards)` <br>
highlight the current dot
6. `updateCarousel(cardContainer, indicatorsContainer, currentStartIndex, visibleCards)` <br>
if (totalCards > visibleCards) calculate card+margin size and shift by currentStartIndex ` totalHeight,
then call `updateDots()`