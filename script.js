let lastData = null; // Variable to store the last fetched data
let eventsData = null; // Declare a variable to store the fetched events


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
        const eventData =  {events: [...eventData1, ...eventData2]};
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

        // Display events only if data has changed
        displayEvents(newData, new Date()); // Display events for today
        displayFutureEvents(newData); // Display future events
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
        });
        
        weekContainer.appendChild(dayDiv);
    }
}

// Display event cards and highlight the closest event
function displayEvents(events, selectedDate) {
    const eventContainer = document.getElementById('event-container');
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    // Clear existing content
    eventContainer.innerHTML = '';

    // Get up to 10 relevant events, for Today or Future days,
    //depending on the selected date
    const relevantEvents = (isToday ? filterAndSortTodayEvents : filterAndSortFutureEvents)(events, selectedDate).slice(0, 5);

    if (relevantEvents.length === 0) {
        eventContainer.appendChild(createNoEventsCard());
    } else {
        relevantEvents.forEach(event => {
            const { card, timeDiff } = createEventCard(event, selectedDate);
            eventContainer.appendChild(card);

            // Highlight or label event only if it's today
            if (isToday) {
                timeDiff > 0 && timeDiff <= 7200000 ? highlightEvent(card) : laterEvent(card);
            }
        });
    }

}


// Function to create the "No Events Today" card
function createNoEventsCard() {
    const card = document.createElement('div');
    card.innerHTML = `
        <div class="no-events-text">
        <i class="bi bi-emoji-frown"></i>
        No events today
        </div>
    `;
    return card;
}


// Create event card
function createEventCard(event, selectedDate) {
    const eventStartDate = new Date(event.start);
    const timeDiff = eventStartDate - selectedDate;

    const card = document.createElement('div');
    card.classList.add('event-card', 'card', 'mb-3', 'shadow-sm', 'bg-light');
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${event.title}</h5> 
            <p class="card-text"><span class="label">Library:</span> ${event.campus.name || 'N/A'}</p>
            <p class="card-text"><span class="label">Location:</span> ${event.location.name || 'N/A'}</p>
            <p class="card-text"><span class="label">When:</span> ${formatTime(eventStartDate)} - ${formatTime(new Date(event.end))}</p>
        </div>
    `;

    return { card, timeDiff };
}

// Add highlight-card class for light yellow background,
// and Happening soon little box
function highlightEvent(card) {
    card.classList.add('highlight-card');
    card.innerHTML += `<div class="happening-soon">Happening soon</div>`;
}

// Add Later today little box
function laterEvent(card) {
    card.classList.add('later-card');
    card.innerHTML += `<div class="later-today">Later today</div>`;
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
                    ${formatTime(eventStart)} - ${formatTime(eventEnd)} &nbsp;&nbsp; | &nbsp;&nbsp; ${event.campus.name} &nbsp;&nbsp; | &nbsp;&nbsp; ${location}
                </div>
            </div>
        `;

        importantEventsList.appendChild(eventDiv);
    });
}



// Filter and sort future events (setting the start at midnight) by start time
function filterAndSortFutureEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime();
            return eventStart >= startOfDay && eventStart <= endOfDay; // if Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}

// Filter and sort Today events by start time
function filterAndSortTodayEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start).getTime(); 
            return eventStart >= startOfDay && eventStart <= endOfDay; // if Event is today
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
                event.category.some(
                    cat => cat.name === 'Important' || 
                    cat.name === 'Scholarly Resources'
                )
            );
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));
}





// Initialize the page and refresh every 10 minutes
function init() {
    checkForUpdates(); // Fetch the events on initial load
    displayMonthHeader();
    displayWeek();

    // Check for updates every 1 minutes (60,000 milliseconds)
    setInterval(checkForUpdates, 60000);
}

init();
