// Variables to store the last fetched data for comparison if data changes
let currentEventsData = null;

const visibleCards = 8;
const visibleCards_footer = 5;
let currentStartIndex = 0;
let currentStartIndex_footer = 0;


function genQRCode(elementId, url) {
    const element = document.getElementById(elementId);

    // Clear any existing QR code if present
    element.innerHTML = "";

    new QRCode(element, {
        text: url,
        width: 90,
        height: 90,
        render: 'svg'
    });
}



// Format time to display only hours and minutes
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
}


// function to schedule a cronjob
function scheduleTask(targetTime, task) {
    // Calculate the target time in milliseconds
    const now = new Date();
    const target = new Date();
    target.setHours(targetTime.hours, targetTime.minutes, 0, 0); // Set the hours and minutes of the target time

    // If the target time has already passed today, schedule for the next day
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    // Calculate the time remaining until the task should be executed
    const delay = target - now;

    // Use setTimeout to schedule the task and reschedule it daily using setInterval
    setTimeout(() => {
        task(); // Call the function at the specified time

        // Schedule the task to be executed every 24 hours after the first run
        setInterval(task, 24 * 60 * 60 * 1000);
    }, delay);
}
function scheduleEveryMinuteAt(secondsOffset, interval, task) {
    // Calculate the time until the first occurrence at `secondsOffset` seconds after the start of each minute
    const now = new Date();
    const nextRun = new Date();
    nextRun.setSeconds(secondsOffset, 0); // Set seconds to the offset (e.g., 10 seconds) and milliseconds to 0

    // If the current time has already passed this second mark within the current minute, schedule for the next minute
    if (nextRun <= now) {
        nextRun.setMinutes(nextRun.getMinutes() + 1);
    }

    // Calculate the delay until the first execution
    const delay = nextRun - now;

    // Schedule the task to run at the first occurrence
    setTimeout(() => {
        task(); // Execute the task

        // Schedule the task to run every minute afterwards
        setInterval(task, interval * 1000); // 60 seconds (1 minute) interval
    }, delay);
}

// Fetch JSON file
async function fetchEventData(filePath) {
    let eventData = [];
    try {
        const response = await fetch(filePath, { method: 'GET' });
        if (response.ok) {
            const data = await response.json();
            eventData = Array.isArray(data.events) ? data.events : [];
        } else {
            console.warn(`File ${filePath} not found (404), ignoring...`);
        }
    } catch (error) {
        console.warn(`Error fetching events from ${filePath}:`, error);
    }
    return eventData;
}

// Fetch JSON files and load them into 1 Object
async function getEvents() {
    try {
        // Fetch ONE JSON file
        //const response = await fetch('events_data.json', { method: 'GET' });
        //const eventData = await response.json();

        const eventData1 = await fetchEventData('events_data.json');
        const eventData2 = await fetchEventData('events_data2.json');

        // Combine the two event data arrays
        const eventData = { events: [...eventData1, ...eventData2] };

        return eventData; // Return the fetched event data

    } catch (error) {
        console.error('Error fetching events:', error);
    }
}


// load JSON, and create events and containers
async function firstLoad() {
    const newData = await getEvents();
    currentEventsData = newData;
    console.log('firstLoad()');

    // Create cards for all Events
    displayEvents(newData, new Date()); // Display events for today
    displayFooterEvents(newData); // Display future events

    // Initialize carousel dots
    initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);
    initializeDots(document.querySelector('#carousel-footer'), document.getElementById('carousel-indicators-footer'), visibleCards_footer);

    // Initialize Carousel containers to hide under
    updateElementHeight('.footer-item', '#footer-events-container', visibleCards_footer); // For event items
    updateElementHeight('.card.mb-3.shadow-sm.bg-light', '#events-container', visibleCards); // For cards

}


// Check if the Json Object has changed, and if so, call displayEvents & displayFooterEvents
async function checkForUpdates() {
    const newData = await getEvents();

    // Compare the newly read data with the last fetched data
    if (newData && JSON.stringify(newData) !== JSON.stringify(currentEventsData)) {
        console.log('Data has changed, refreshing the page...');
        currentEventsData = newData;

        // Display events only if data has changed
        displayEvents(newData, new Date());
        displayFooterEvents(newData);

        initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);
        initializeDots(document.querySelector('#carousel-footer'), document.getElementById('carousel-indicators-footer'), visibleCards_footer);
    } else {
        console.log('No change in data.');
    }
}


// Display the current Month header with the icon
function displayMonthHeader() {
    const monthHeader = document.getElementById('month-container');
    const today = new Date();

    monthHeader.innerHTML = `
        <i class="bi bi-calendar3"></i>
        <h3>${today.toLocaleString('default', { month: 'long' })}</h3>
    `;
}


// Track the last highlighted date globally or within scope
let lastHighlightedDate = null;
// Display the week, starting from Monday until Sunday
function displayWeek() {
    const weekContainer = document.getElementById('week-container');
    const today = new Date();
    const startOfWeek = new Date();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Map Sunday (0) to 6, Monday (1) to 0, etc.
    const daysFromMonday = (today.getDay() + 6) % 7;
    startOfWeek.setDate(today.getDate() - daysFromMonday);

    // Clear existing week content if any, and event listeners
    weekContainer.innerHTML = '';

    // Generate the week and add elements to the container
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('p-2', 'text-center', 'clickable');
        dayDiv.setAttribute('data-date', dayDate.toISOString()); // Store date as data attribute
        dayDiv.innerHTML = `
            <div>${dayDate.getDate()}</div>
            <div>${dayNames[i]}</div>
        `;

        // when the loop reaches Today: Highlight today
        if (dayDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('highlight');

            // if the currently selected day is not today already, refresh cards, otherwise do nothing and cards will not be updated
            if (lastHighlightedDate && lastHighlightedDate.toDateString() !== today.toDateString()) {
                displayEvents(currentEventsData, dayDate); // Refresh display for today
                initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);
            }

            lastHighlightedDate = dayDate; // Update the last highlighted date
        }

        weekContainer.appendChild(dayDiv);
    }

    // Add an event listener to the weekContainer and uses Event Delegation to identify clicks on day elements
    weekContainer.addEventListener('click', (event) => {
        const clickedDay = event.target.closest('.clickable');
        if (!clickedDay) return; // Ignore clicks outside of day elements

        // Retrieve the date from the data attribute
        const dayDate = new Date(clickedDay.getAttribute('data-date'));

        // Check if the clicked day is already highlighted
        const previouslyHighlighted = weekContainer.querySelector('.highlight');
        if (previouslyHighlighted && previouslyHighlighted === clickedDay) {
            // If the clicked day is already highlighted, do nothing
            return;
        }

        // Remove highlight from previously highlighted day
        if (previouslyHighlighted) {
            previouslyHighlighted.classList.remove('highlight');
        }

        // Highlight the clicked day
        clickedDay.classList.add('highlight');

        // Show events for the clicked day
        displayEvents(currentEventsData, dayDate);
        initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);

        // Update lastHighlightedDate for subsequent calls
        lastHighlightedDate = dayDate;
    });
}




// Display event cards and highlight the closest event
function displayEvents(events, selectedDate) {
    const eventContainer = document.getElementById('carousel');
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Clear existing content
    eventContainer.innerHTML = '';

    // Filter events from JSON for Today or Other days (clicked), and select first 20. If other day show ALL events, not just future ones.
    const relevantEvents = (isToday ? filterAndSortTodayEvents : filterAndSortOtherdayEvents)(events, selectedDate).slice(0, 20);

    if (
        events.events.length === 1 &&
        events.events[0].title === "Server down"
    ) {
        //console.log(events);
        eventContainer.appendChild(createServerDownCard());
    } else if (relevantEvents.length === 0) {
        eventContainer.appendChild(createNoEventsCard());
        //genQRCode("noevents", "https://www.library.unsw.edu.au/about-unsw-library/whats-on");
    } else {
        relevantEvents.forEach(event => {
            const { card, timeDiff } = createEventCard(event, selectedDate);
            eventContainer.appendChild(card);

            // Highlight or label event only if it's today, less than 2hrs
            if (isToday) {
                if (timeDiff < 0) {
                    nowEvent(card); // Call nowEvent if timeDiff is less than 0
                } else if (timeDiff > 0 && timeDiff <= 7200000) {
                    soonEvent(card); // Call soonEvent if timeDiff is between 0 and 2 hours
                } else {
                    laterEvent(card); // Call laterEvent for other cases
                }
            }

            // Generate QR code for the specific event URL
            genQRCode(`qrcode_${event.id}`, event.url.public);
        });

    }
}


// Filter and sort Today events by start time (drop them if endtime is passed)
function filterAndSortTodayEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            //const eventStart = new Date(event.start).getTime();
            //return eventStart >= startOfDay && eventStart <= endOfDay; 
            const eventEnd = new Date(event.end).getTime();
            return eventEnd >= startOfDay &&
                eventEnd <= endOfDay &&
                event.campus.name === 'Main Library' &&
                event.location.name !== '';
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}


// Filter and sort Other days events by start time (setting the start at midnight)
function filterAndSortOtherdayEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime();
            return eventStart >= startOfDay &&
                eventStart <= endOfDay &&
                event.campus.name === 'Main Library' &&
                event.location.name !== ''; // if Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}


// Function to create the "No Events Today" card
function createNoEventsCard() {
    const card = document.createElement('div');
    card.classList.add('no-events');
    card.innerHTML = `
        <div class="no-events-text">
        <i class="bi bi-calendar-x"></i>
        No events today 
        </div>
        <div id="noevents">
        </div>
    `;
    return card;
}

// Function to create the "Server Down" card
function createServerDownCard() {
    const card = document.createElement('div');
    card.classList.add('server-down');
    card.innerHTML = `
        <div class="server-down-text">
        <i class="bi bi-wifi-off"></i>
        System offline
        </div>
        <div id="serverdown">
        </div>
    `;
    return card;
}

// Create event card
function createEventCard(event, selectedDate) {
    const eventStartDate = new Date(event.start);
    const timeDiff = eventStartDate - selectedDate;

    const card = document.createElement('div');
    card.classList.add('card', 'mb-3', 'shadow-sm', 'bg-light');
    card.innerHTML = `
        <div class="card-body">
        <div>
            <h5 class="card-title">${event.title}</h5> 
            <!--   <p class="card-text"><span class="label">Library:</span> ${event.campus.name || 'N/A'}</p>   -->
            <p class="card-text"><span class="label">Time:</span> ${formatTime(eventStartDate)} - ${formatTime(new Date(event.end))}</p>
            <p class="card-text"><span class="label">Location:</span> ${event.location.name || 'N/A'}</p>
        </div>
        </div>

        <div id="qrcode_${event.id}" class="qr_event"></div>
        <a href="${event.url.public}" target="_blank" class="qr-button">
        <span>Event URL</span>
        </a>
    `;

    return { card, timeDiff };
}


// Add happening-now class, and Happening now text
function nowEvent(card) {
    card.classList.add('now-card');

    // Create a container for the title and "Happening now" elements
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('title-container');

    // Move the title into the container
    const titleElement = card.querySelector('.card-title');
    if (titleElement) {
        titleContainer.appendChild(titleElement);
    }

    // Create and add the "Happening soon" element
    const happeningSoonElement = document.createElement('div');
    happeningSoonElement.classList.add('happening-now');
    happeningSoonElement.textContent = 'Now';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}


// Add soon-card class and Happening soon text
function soonEvent(card) {
    card.classList.add('soon-card');
    //card.innerHTML += `<div class="happening-soon">Happening soon</div>`;

    // Create a container for the title and "Happening soon" elements
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('title-container');

    // Move the title into the container
    const titleElement = card.querySelector('.card-title');
    if (titleElement) {
        titleContainer.appendChild(titleElement);
    }

    // Create and add the "Happening soon" element
    const happeningSoonElement = document.createElement('div');
    happeningSoonElement.classList.add('happening-soon');
    happeningSoonElement.textContent = 'Soon';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}


// Add later-card class and Later today text
function laterEvent(card) {
    card.classList.add('later-card');

    // Create a container for the title and "Later today" elements
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('title-container');

    // Move the title into the container
    const titleElement = card.querySelector('.card-title');
    if (titleElement) {
        titleContainer.appendChild(titleElement);
    }

    // Create and add the "Happening soon" element
    const happeningSoonElement = document.createElement('div');
    happeningSoonElement.classList.add('later-today');
    happeningSoonElement.textContent = 'Later';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}


function displayFooterEvents(events) {
    const FooterEventsList = document.getElementById('carousel-footer');
    FooterEventsList.innerHTML = '';
    const FooterEvents = filterAndSortFooterEvents(events, new Date()).slice(0, 20);

    // Create a structured list of event details
    FooterEvents.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const dayNumber = eventStart.getDate();
        const dayName = eventStart.toLocaleString('default', { weekday: 'short' });
        const location = event.location.name || 'N/A';

        // Create a new div for each event
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('footer-item', 'my-2');
        eventDiv.innerHTML = `
            <div class="card-date-footer">
                <strong>${dayNumber}</strong>
                <span>${dayName}</span>
            </div>
            <div class="card-details-footer">
                <div class="card-title-footer">${event.title}</div>
                <div class="card-timelocation-footer">
                    <i class="bi bi-stopwatch"></i>
                    <span class="time">${formatTime(eventStart)} - ${formatTime(eventEnd)}</span>
                    <i class="bi bi-geo-alt-fill"></i>
                    <span class="location"> ${location}</span>
                </div>
            </div>
            
            <div id="qrcode_footer_${event.id}" class="qr_footer"></div>
            <a href="${event.url.public}" target="_blank" class="qr-button">
            <span>Event URL</span>
            </a>
        `;

        FooterEventsList.appendChild(eventDiv);

        // Generate QR code for the specific event URL
        genQRCode(`qrcode_footer_${event.id}`, event.url.public);
    });
}


function filterAndSortFooterEvents(events, currentDate) {
    //const tomorrow = new Date(currentDate).setHours(0, 0, 0, 0);
    //const DaysAhead = new Date(currentDate).setDate(currentDate.getDate() + 5);
    
    // Set "tomorrow" to 15/01/2025 00:00:00
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
    tomorrow.setHours(0, 0, 0, 0); // Reset to midnight

    // Set "DaysAhead" to 19/01/2025 23:59:59
    const DaysAhead = new Date(currentDate);
    DaysAhead.setDate(DaysAhead.getDate() + 5); // Move to 5 days later
    DaysAhead.setHours(23, 59, 59, 999); // Set to end of day

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime();
            return (
                eventStart >= tomorrow &&
                eventStart <= DaysAhead &&
                event.campus.name === 'Main Library' &&
                event.location.name !== '' &&
                event.category.some(
                    cat =>
                        cat.name === 'Important' ||
                        cat.name === 'Scholarly Resources'
                )
            );
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));
}



/* update Carousel one card at a time 
function initializeDots(cardContainer, indicatorsContainer, visibleCards) {
    //only count divs elements
    //const totalCards = Array.from(cardContainer.children).filter(child => child.tagName === 'DIV').length;
    //counts all direct children elements
    const totalCards = cardContainer.children.length;
    const totalDots = totalCards - visibleCards;

    // Generate dots
    if (totalDots > 0) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < totalDots + 1; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            // Set the first dot as active
            if (i === 0) dot.classList.add('active');
            // Append to fragment, not directly to DOM
            fragment.appendChild(dot);
        }
        indicatorsContainer.appendChild(fragment);
    }
}
function updateDots(indicatorsContainer, currentStartIndex) {
    const dots = indicatorsContainer.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));
    dots[currentStartIndex].classList.add('active');
}
function updateCarousel(cardContainer, indicatorsContainer, currentStartIndex, visibleCards) {
    const cards = Array.from(cardContainer.children).filter(child => child.tagName === 'DIV');
    const totalCards = cards.length;

    if (totalCards > visibleCards) {
        const card = cards[0];
        const { offsetHeight } = card;
        const computedStyle = window.getComputedStyle(card);
        const totalHeight = offsetHeight + parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
        console.log('totalHeight = ', totalHeight);

        // Move the carousel
        cardContainer.style.transform = `translateY(-${currentStartIndex * totalHeight}px)`;

        // Update dots
        updateDots(indicatorsContainer, currentStartIndex);

        // Increment index for next rotation, cycling back if needed
        return currentStartIndex = (currentStartIndex + 1) % (totalCards - visibleCards + 1);
    } else {
        // Reset the carousel position if not enough cards
        carousel.style.transform = `translateY(0px)`;
        return 0;
    }
}
*/


function initializeDots(cardContainer, indicatorsContainer, visibleCards) {
    const totalCards = cardContainer.children.length;
    const totalDots = Math.max(0, Math.ceil(totalCards / visibleCards));

      // Add a condition to update the CSS for single dot case
      if (totalDots === 1) {
        indicatorsContainer.classList.add('single-dot'); // Add a specific class
    } else {
        indicatorsContainer.classList.remove('single-dot'); // Remove it otherwise
    }

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');  // Set the first dot as active
        fragment.appendChild(dot);
    }
    // Append all dots at once to avoid multiple DOM reflows
    indicatorsContainer.innerHTML = '';  // Clear previous dots, if any
    indicatorsContainer.appendChild(fragment);
}


function updateDots(indicatorsContainer, currentStartIndex, visibleCards, totalCards) {
    const dots = indicatorsContainer.querySelectorAll('.dot');

    // Calculate the total shifts needed to reach the last set of visible cards
    const totalShifts = Math.ceil((totalCards - visibleCards) / visibleCards);

    // Determine the current dot index
    let currentDot = Math.floor(currentStartIndex / visibleCards);

    // Ensure that the last dot gets activated if it's the final partial shift
    if (currentStartIndex + visibleCards >= totalCards) {
        currentDot = totalShifts; // Activate the last dot
    }

    // Update dot classes
    dots.forEach(dot => dot.classList.remove('active'));  // Remove 'active' from all dots
    dots[currentDot]?.classList.add('active');  // Add 'active' to the correct dot (if it exists)
}

function updateCarousel(cardContainer, indicatorsContainer, currentStartIndex, visibleCards) {
    const cards = Array.from(cardContainer.children).filter(child => child.tagName === 'DIV');
    const totalCards = cards.length;

    if (totalCards > visibleCards) { 
        const card = cards[0]; 
        const offsetHeight = card.getBoundingClientRect().height; 
        const computedStyle = window.getComputedStyle(card); 
        const totalHeight = offsetHeight + parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom); 
     
        // Move the carousel 
        cardContainer.style.transform = `translateY(-${currentStartIndex * totalHeight}px)`; 
     
        // Update dots 
        updateDots(indicatorsContainer, currentStartIndex, visibleCards, totalCards); 
     
        // Hide all cards first 
        cards.forEach(card => { 
            card.style.opacity = 0; // Hide the card 
            card.style.transition = 'opacity 0.5s ease 0.0s'; 
        }); 
     
        // Calculate start and end indices for the current group of visible cards 
        const endIndex = Math.min(currentStartIndex + visibleCards, totalCards); 
     
        // Show the cards in the current group 
        for (let i = currentStartIndex; i < endIndex; i++) { 
            cards[i].style.opacity = 1; // Make visible 
            cards[i].style.transition = 'opacity 0.5s ease 0.5s'; 
        } 
         
        // Increment index for next rotation, cycling back if needed 
        const remainingCards = totalCards - currentStartIndex; 
        if (remainingCards > visibleCards) { 
            // Shift by visibleCards if there are enough remaining cards 
            currentStartIndex += visibleCards; 
        } else { 
            // Shift by the remaining cards if there are fewer than visibleCards left 
            currentStartIndex = 0; // Reset to the first set of cards after the last shift 
        } 
     
        // Ensure currentStartIndex stays within bounds 
        //currentStartIndex = Math.min(currentStartIndex, totalCards - visibleCards); 
        //console.log(currentStartIndex); 
     
        return currentStartIndex; 
    } else { 
        // Reset the carousel position if not enough cards 
        cardContainer.style.transform = `translateY(0px)`; 
        return 0; 
    } 
  
    
} 


function updateElementHeight(elementSelector, containerSelector, multiplier) {
    // Get the target element and container
    const element = document.querySelector(elementSelector);
    const container = document.querySelector(containerSelector);

    // If the element doesn't exist, set default events-container & footer-events-container vertical sizes
    if (!element) {
        console.log('No card elements');
        if (container.id === 'events-container') {
            container.style.height = `${206.375 * multiplier}px`;
        } else if (container.id === 'footer-events-container') {
            container.style.height = `${174.375 * multiplier}px`;
        }
        return;
    }

    // Calculate the total height including margin
    const offsetHeight = element.getBoundingClientRect().height;
    const { marginTop, marginBottom } = window.getComputedStyle(element);
    const totalHeight = offsetHeight + parseFloat(marginTop) + parseFloat(marginBottom);

    // Set the height of the container based on the element's total height and multiplier
    container.style.height = `${totalHeight * multiplier}px`;
}



const slides = document.querySelectorAll('.banner-slide');
let bannerIndex = 0;
function showNextBanner() {
    // Hide current slide
    slides[bannerIndex].classList.remove('active');
    // Update index
    bannerIndex = (bannerIndex + 1) % slides.length;
    // Show next slide
    slides[bannerIndex].classList.add('active');
}





// Initialize the page and refresh every 10 minutes
function init() {
    // Get references to frequently used elements
    const carousel = document.querySelector('#carousel');
    const carouselIndicators = document.getElementById('carousel-indicators');
    const carouselFooter = document.querySelector('#carousel-footer');
    const carouselIndicatorsFooter = document.getElementById('carousel-indicators-footer');

    // Store references to DOM elements upfront to avoid querying in intervals
    const updateInterval = 5000;
    const updateFooterInterval = 2000 * Math.PI;
    const refreshInterval = 60000;

    // Fetch the events on initial load and create Cards and Calendar
    firstLoad();
    displayMonthHeader();
    displayWeek();

    /*
    // if on another day, re-set to Today, and also call displayEvents & initializeDots
    setInterval(() => {
        displayWeek();
        console.log('displayWeek()');
    }, 60000);
    */
    scheduleTask({ hours: 1, minutes: 10 }, () => {
        displayWeek();
        console.log('displayWeek()');
    });

    // Set updates to check JSON (60s)
    setInterval(() => {
        checkForUpdates();
        console.log('checkForUpdates()');
    }, 60000);

    /*
    // Refresh Happening status and drop expired cards (60s), ONLY if the calendar day is TODAY
    setInterval(() => {
        if (lastHighlightedDate && lastHighlightedDate.toDateString() === new Date().toDateString()) {
            displayEvents(currentEventsData, lastHighlightedDate);
            initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);
            console.log('displayEvents()');
            console.log(lastHighlightedDate);
        };
    }, 20000);
*/

    // Example usage: Schedule a task to run 1 seconds after every 20 seconds
    scheduleEveryMinuteAt(1, 30, () => {
        if (lastHighlightedDate && lastHighlightedDate.toDateString() === new Date().toDateString()) {
            displayEvents(currentEventsData, new Date());
            initializeDots(document.querySelector('#carousel'), document.getElementById('carousel-indicators'), visibleCards);
            console.log('displayEvents()');
            console.log(lastHighlightedDate);
        };
    });


    // Set up carousel intervals
    setInterval(() => {
        currentStartIndex = updateCarousel(
            carousel,
            carouselIndicators,
            currentStartIndex,
            visibleCards
        );
    }, updateInterval);

    setInterval(() => {
        currentStartIndex_footer = updateCarousel(
            carouselFooter,
            carouselIndicatorsFooter,
            currentStartIndex_footer,
            visibleCards_footer
        );
    }, updateFooterInterval);

    let resizing = false;
    window.addEventListener('resize', () => {
        if (!resizing) {
            resizing = true;
            requestAnimationFrame(() => {
                updateElementHeight('.footer-item', '#footer-events-container', visibleCards_footer);
                updateElementHeight('.card.mb-3.shadow-sm', '#events-container', visibleCards);
                resizing = false;
            });
        }
    });



    // Automatically switch banner every 5 seconds
    setInterval(showNextBanner, 15000);

}

init();
