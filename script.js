let lastData = null; // Variable to store the last fetched data
let eventsData = null; // Declare a variable to store the fetched events

function genQRCode(elementId, url) {
    const element = document.getElementById(elementId);

    // Clear any existing QR code if present
    element.innerHTML = "";
    new QRCode(element, {
        text: url,
        width: 70,
        height: 70
    });
}
//genQRCode("qrcode", window.location.href);


// Format time to display only hours and minutes
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
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
    console.log(eventData);
    return eventData;
}

// Fetch JSON files and load them into 1 Object
async function getEvents() {
    try {
        /*
        // Fetch the JSON file
        const response = await fetch('events_data.json', { method: 'GET' });
        const eventData = await response.json();
        */

        const eventData1 = await fetchEventData('events_data.json');
        const eventData2 = await fetchEventData('events_data2.json');

        // Combine the two event data arrays
        const eventData = { events: [...eventData1, ...eventData2] };
        console.log(eventData);

        return eventData; // Return the fetched event data

    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Check if the Json Object has changed, and if so, 
// call displayEvents & displayFutureEvents
async function checkForUpdates() {
    const newData = await getEvents();

    // Compare the newly read data with the last fetched data
    if (newData && JSON.stringify(newData) !== JSON.stringify(lastData)) {
        console.log('Data has changed, refreshing the page...');
        lastData = newData; // Update lastData to the new data
        eventsData = newData; // Store the fetched events for later use

    } else {
        console.log('No change in data.');
    }

    // Display events only if data has changed
    displayEvents(newData, new Date()); // Display events for today
    displayFutureEvents(newData); // Display future events

    clearDots();
    initializeDots();


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

// Display the week, starting from Monday until Sunday
function displayWeek() {
    const weekContainer = document.getElementById('week-container');
    const today = new Date();
    const startOfWeek = new Date();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Map Sunday (0) to 6, Monday (1) to 0, etc.
    const daysFromMonday = (today.getDay() + 6) % 7;
    startOfWeek.setDate(today.getDate() - daysFromMonday);

    // Clear existing week content if any
    weekContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        // Get the date for each day of the week
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('p-2', 'text-center', 'clickable');
        dayDiv.innerHTML = `
            <div>${dayDate.getDate()}</div>
            <div>${dayNames[i]}</div>
        `;

        if (dayDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('highlight');
        }

        // Add click event listener to display events for the clicked day
        dayDiv.addEventListener('click', () => {

            // Remove 'highlight' from all days
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));

            // Highlight the clicked day
            dayDiv.classList.add('highlight');

            // Show events for the clicked day
            displayEvents(eventsData, dayDate);

            clearDots();
            initializeDots();
        });

        weekContainer.appendChild(dayDiv);
    }
}

// Display event cards and highlight the closest event
function displayEvents(events, selectedDate) {
    const eventContainer = document.getElementById('carousel');
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Clear existing content
    eventContainer.innerHTML = '';

    // Get up to 10 relevant events, for Today or Future days,
    // depending on the selected date
    const relevantEvents = (isToday ? filterAndSortTodayEvents : filterAndSortFutureEvents)(events, selectedDate).slice(0, 10);

    if (relevantEvents.length === 0) {
        eventContainer.appendChild(createNoEventsCard());
        genQRCode("noevents", "https://www.library.unsw.edu.au/about-unsw-library/whats-on");
    } else {
        relevantEvents.forEach(event => {
            const { card, timeDiff } = createEventCard(event, selectedDate);
            eventContainer.appendChild(card);

            // Highlight or label event only if it's today, less than 2hrs
            if (isToday) {
                if (timeDiff < 0) {
                    nowEvent(card); // Call nowEvent if timeDiff is less than 0
                } else if (timeDiff > 0 && timeDiff <= 7200000) {
                    highlightEvent(card); // Call highlightEvent if timeDiff is between 0 and 2 hours
                } else {
                    laterEvent(card); // Call laterEvent for other cases
                }
            }

            // Generate QR code for the specific event URL
            genQRCode(`qrcode_${event.id}`, event.url.public);
        });



    }

}


// Function to create the "No Events Today" card
function createNoEventsCard() {
    const card = document.createElement('div');
    card.classList.add('no-events');
    card.innerHTML = `
        <div class="no-events-text">
        <i class="bi bi-emoji-frown"></i>
        No events at Main Library
        </div>
        <div id="noevents">
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
            <p class="card-text"><span class="label">Location:</span> ${event.location.name || 'N/A'}</p>
            <p class="card-text"><span class="label">When:</span> ${formatTime(eventStartDate)} - ${formatTime(new Date(event.end))}</p>
        </div>
        </div>

        <div id="qrcode_${event.id}" class="qr_event"></div>
        <a href="${event.url.public}" target="_blank" class="qr-button">
        <span>Event URL</span>
        </a>
    `;

    return { card, timeDiff };
}

// Add highlight-card class for light yellow background,
// and Happening soon little box
function highlightEvent(card) {
    card.classList.add('highlight-card');
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
    happeningSoonElement.textContent = 'Happening soon';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}

// Add Later today little box
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
    happeningSoonElement.textContent = 'Happening now';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}

// Add Later today little box
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
    happeningSoonElement.textContent = 'Later today';
    titleContainer.appendChild(happeningSoonElement);

    // Insert the title container at the beginning of the card-body
    const cardBody = card.querySelector('.card-body > div');
    if (cardBody) {
        cardBody.prepend(titleContainer);
    }
}


function displayFutureEvents(events) {
    const importantEventsList = document.getElementById('important-events-list');
    importantEventsList.innerHTML = '';
    const upcomingEvents = filterAndSortImportantEvents(events, new Date()).slice(0, 4);

    // Create a structured list of event details
    upcomingEvents.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const dayNumber = eventStart.getDate();
        const dayName = eventStart.toLocaleString('default', { weekday: 'short' });
        const location = event.location.name || 'N/A';

        // Create a new div for each event
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event-item', 'my-2');
        eventDiv.innerHTML = `
            <div class="event-date">
                <strong>${dayNumber}</strong>
                <span>${dayName}</span>
            </div>
            <div class="event-details">
                <div class="event-title">${event.title}</div>
                <div class="event-time-location">
                    ${formatTime(eventStart)} - ${formatTime(eventEnd)} &nbsp;&nbsp; | &nbsp;&nbsp; ${location}
                </div>
            </div>
            
            <div id="qrcode_future_${event.id}" class="qr_future"></div>
            <a href="${event.url.public}" target="_blank" class="qr-button">
            <span>Event URL</span>
            </a>
        `;

        importantEventsList.appendChild(eventDiv);

        // Generate QR code for the specific event URL
        genQRCode(`qrcode_future_${event.id}`, event.url.public);

    });
}



// Filter and sort future events (setting the start at midnight) by start time
function filterAndSortFutureEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime();
            return eventStart >= startOfDay && 
            eventStart <= endOfDay && 
            event.campus.name === 'Main Library'; // if Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}

// Filter and sort Today events by start time
function filterAndSortTodayEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            //const eventStart = new Date(event.start).getTime();
            //return eventStart >= startOfDay && eventStart <= endOfDay; // if Event is today
            const eventEnd = new Date(event.end).getTime();
            return eventEnd >= startOfDay && 
            eventEnd <= endOfDay && 
            event.campus.name === 'Main Library'; // if Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}

function filterAndSortImportantEvents(events, currentDate) {
    const tomorrow = new Date(currentDate).setHours(0, 0, 0, 0);
    const DaysAhead = new Date(currentDate).setDate(currentDate.getDate() + 5);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime();
            return (
                eventStart > tomorrow &&
                eventStart <= DaysAhead &&
                event.campus.name === 'Main Library' &&
                event.category.some(
                    cat => cat.name === 'Important' ||
                        cat.name === 'Scholarly Resources'
                )
            );
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));
}


const visibleCards = 5;
let currentStartIndex = 0;

function clearDots() {
    const indicatorsContainer = document.getElementById('carousel-indicators');
    indicatorsContainer.innerHTML = ''; // Clears all existing dot elements
}

function initializeDots() {
    const totalCards = document.querySelectorAll('.card').length;
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const totalDots = totalCards - visibleCards;

    // Generate dots
    if (totalCards > visibleCards) {
        for (let i = 0; i < totalDots + 1; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active'); // Set the first dot as active
            indicatorsContainer.appendChild(dot);
        }
    }
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));
    dots[currentStartIndex].classList.add('active');
}

function updateCarousel() {
    const cards = document.querySelectorAll('.card');
    const totalCards = cards.length;


    if (totalCards > visibleCards) {
        const carousel = document.querySelector('#carousel');
        const card = document.querySelector('.card.mb-3.shadow-sm.bg-light');
        const cardHeight = card.offsetHeight;
        const computedStyle = window.getComputedStyle(card);
        const marginTop = parseFloat(computedStyle.marginTop);
        const marginBottom = parseFloat(computedStyle.marginBottom);
        const totalHeight = cardHeight + marginTop + marginBottom;

        // Move the carousel
        carousel.style.transform = `translateY(-${currentStartIndex * totalHeight}px)`;

        // Update dots
        updateDots();

        // Increment index for next rotation, cycling back if needed
        currentStartIndex = (currentStartIndex + 1) % (totalCards - visibleCards + 1);
    } else {
        // Reset the carousel position if not enough cards
        carousel.style.transform = `translateY(0px)`;
    }
}














// Initialize the page and refresh every 10 minutes
function init() {
    checkForUpdates(); // Fetch the events on initial load
    displayMonthHeader();
    displayWeek();

    // Only set interval if there are more than 5 cards
    setInterval(updateCarousel, 15000);

    // Check for updates every 1 minutes (60,000 milliseconds)
    setInterval(checkForUpdates, 60000);
}

init();
