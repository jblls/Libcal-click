# What's On website.

JS reads the JSON uploaded to the S3 bucket <br/>
with an AWS Lambda, triggered every X hours. <br/>

The python script: <br/>
*/home/ste/Documents/libcal/libcal.py* <br/> 
also uploades the JSON to this github repo using PyGithub.</br>
It needs an access token generated from Settings > Developer Settings > Personal Access Tokens, with repo permissions. 


## Webapp structure

The `init()` function calls `firstLoad()`, which calls:

1. `getEvents()` which calls 
    - `fetchEventData(filePath)` to load the 2 JSON returning **eventData**.
2. `displayEvents(newData, new Date())`
3. `displayFooterEvents(newData)`
4. `initializeDots()` main and footer,
6. `updateElementHeight()` main and footer, if no Events today, set default based on big screen view.

`displayMonthHeader()` and `displayWeek()` <br>
`displayWeek()` is called at 1am everyday, and it has an addEventListener on click, to check for change of week day, to:

1. recreate the weekContainer html with days,  
2. highligths the current day 
    1. if current day not Today, refresh cards and dots by calling `displayEvents()` & `initializeDots()`
    2. if current day is Today, do nothing, as `displayEvents()` & `initializeDots()` <br>
        will be called independentely
3. add eventlistener to calendar element. If clicking on alreay selected day, do nothing, <br>
otherwise call `displayEvents()` & `initializeDots()`



`checkForUpdates()` calls:

1. `getEvents()` which calls 
    - `fetchEventData(filePath)` to load the 2 JSONs, and collate them to return **eventData**.
    
    if JSON is different, then these are called:
    1. `displayEvents(newData, new Date())`
    2. `displayFooterEvents(newData)`
    3. `initializeDots()` main and footer,


`displayEvents()` & `initializeDots()` are called every 5 minutes to update cards highlight and drop them if past events end time. <br>

`displayEvents()` calls:
1. filter&sort function, 
2. `createEventCard()`
3. highlight cards happening status
4. genQRCode

`displayFooterEvents(events)` calls:
1. filter&sort function, 
2. create footer-item cards with innerHTML
3. genQRCode


`updateCarousel()` is called every 30s. <br>
If totalCards > visibleCards calculate card+margin size, and shift by currentStartIndex, <br>
then calls `updateDots()`


`updateElementHeight()` called in `firstLoad()` to set main container size, and in `init()` <br>
as an EventListener to resize based on mobile/desktop view.