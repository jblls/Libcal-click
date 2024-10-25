let lastData = null; // Variable to store the last fetched data
let eventsData = null; // Declare a variable to store the fetched events


// Fetch events from local JSON file
async function getEvents() {
    try {
        // Fetch the JSON file
        const response = await fetch('https://abjo4xvpap33no3edn665hgjza0axriu.lambda-url.ap-southeast-2.on.aws/', 
            { method: 'GET' }
        );

          // Check if the request was successful
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }


        const eventData = await response.json();

        console.log(eventData);  // Log the event data to verify the content

        return eventData; // Return the fetched event data

    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function checkForUpdates() {
    const newData = await getEvents(); // Fetch the events data

    // Compare the new data with the last fetched data
    if (newData && JSON.stringify(newData) !== JSON.stringify(lastData)) {
        console.log('Data has changed, refreshing the page...');
        lastData = newData; // Update lastData to the new data
        eventsData = newData; // Store the fetched events for later use

        // Display events only if data has changed
        displayEvents(newData, new Date()); // Display events for today
        displayImportantEvents(newData); // Display events for the next 3 days
    } else {
        console.log('No change in data.');
    }
}

// Display the current month header with an icon
function displayMonthHeader() {
    const currentDate = new Date();
    const monthHeader = document.getElementById('month-container');
    monthHeader.classList.add('text-center', 'mb-3');
    monthHeader.innerHTML = `
        <i class="bi bi-calendar3" style="margin-right: 8px;"></i>
        <h3>${currentDate.toLocaleString('default', { month: 'long' })}</h3>
    `;
}

// Display the week, starting from Monday
function displayWeek() {
    const weekContainer = document.getElementById('week-container');
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    const daysToMonday = (currentDay === 0) ? 6 : currentDay - 1;
    startOfWeek.setDate(today.getDate() - daysToMonday);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Clear existing week content if any
    weekContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.classList.add('p-2', 'text-center', 'clickable'); // Added 'clickable' class for interactivity

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
            //console.log(dayDate);
        });


        dayDiv.innerHTML = `<div>${dayDate.getDate()}</div><div>${dayNames[i]}</div>`;
        weekContainer.appendChild(dayDiv);
    }
}

// Display event cards and highlight the closest event
function displayEvents(events, selectedDate) {
    const eventContainer = document.getElementById('event-container');
    const currentDate = new Date();

    eventContainer.innerHTML = '';

    console.log(selectedDate);
    console.log(events);

    // Check if the selectedDate is today
    const isSameDay = selectedDate.toDateString() === currentDate.toDateString();


    const futureEvents = isSameDay
        ? filterAndSortTodayEvents(events, selectedDate)
        : filterAndSortFutureEvents(events, selectedDate);


    console.log(selectedDate);
    console.log(futureEvents);

    // Limit to the next 10 events
    const limitedEvents = futureEvents.slice(0, 10);

    limitedEvents.forEach(event => {
        const { card, timeDiff } = createEventCard(event, selectedDate);
        eventContainer.appendChild(card);


        // If it's a future day, do not add highlighting
        if (isSameDay) {

            // Check if the event starts within the next 2 hours (7200000 milliseconds) 
            if (timeDiff > 0 && timeDiff <= 7200000) {
                highlightEvent(card);
            }
            else {
                laterEvent(card);
            }

        }

    });

}


// Highlight the closest event card
function highlightEvent(card) {
    card.classList.add('highlight-card');
    card.innerHTML += `<div class="happening-soon">Happening soon</div>`;
}

// Highlight the closest event card 

function laterEvent(card) {
    card.classList.add('later-card');
    card.innerHTML += `<div class="later-today">Later today</div>`;
}

function displayImportantEvents(events) {
    const importantEventsList = document.getElementById('important-events-list'); // Updated ID for the events list
    importantEventsList.innerHTML = ''; // Clear previous content
    const currentDate = new Date();
    const upcomingEvents = filterAndSortImportantEvents(events, currentDate);

    // Limit to the next 10 events
    const limitedEvents = upcomingEvents.slice(0, 5);

    // Create a structured list of event details
    limitedEvents.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const dayNumber = eventStart.getDate(); // Get the day number
        const dayName = eventStart.toLocaleString('default', { weekday: 'short' }); // Get the abbreviated day name
        const startTime = formatTime(eventStart); // Use your existing formatTime function
        const endTime = formatTime(eventEnd); // Use your existing formatTime function
        const location = event.location.name || 'N/A'; // Get location

        // Create a new div for each event
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event-item', 'my-2'); // Add classes for styling
        eventDiv.innerHTML = `
            <div class="event-date">
                <strong>${dayNumber}</strong>
                <span>${dayName}</span>
            </div>
            <div class="event-details">
                <div class="event-title">${event.title}</div>
                <div class="event-time-location">${startTime} - ${endTime} &nbsp;&nbsp; | &nbsp;&nbsp; ${event.campus.name} &nbsp;&nbsp; | &nbsp;&nbsp; ${location}</div>
            </div>
        `;

        // Append the eventDiv to the importantEventsList
        importantEventsList.appendChild(eventDiv);
    });
}









// Filter and sort future events by start time
function filterAndSortFutureEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(00, 00, 00, 000); // End of today
    const endOfToday = new Date(selectedDate);
    endOfToday.setHours(23, 59, 59, 999); // End of today

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start); // Get the event's start time
            return eventStart >= startOfDay && eventStart <= endOfToday; // Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}

// Filter and sort Today events by start time
function filterAndSortTodayEvents(events, selectedDate) {
    const startOfDay = new Date(selectedDate);
    const endOfToday = new Date(selectedDate);
    endOfToday.setHours(23, 59, 59, 999); // End of today

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start); // Get the event's start time
            return eventStart >= startOfDay && eventStart <= endOfToday; // Event is today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}

function filterAndSortImportantEvents(events, currentDate) {
    const threeDaysFromNow = new Date(currentDate);
    threeDaysFromNow.setDate(currentDate.getDate() + 5); // Set to three days from now
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 0);
    tomorrow.setHours(0, 0, 0, 0);

    return events.events
        .filter(event => {
            const eventStart = new Date(event.start);
            return (
                eventStart > tomorrow &&
                eventStart <= threeDaysFromNow && // Event is within the next 3 days
                (
                    event.category.some(cat => cat.name === 'Important') ||
                    event.category.some(cat => cat.name === 'Scholarly Resources')
                )
            );
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by start time
}




// Create event card
function createEventCard(event, selectedDate) {
    const eventStartDate = new Date(event.start);
    const formattedTimestart = formatTime(eventStartDate);

    const eventEndDate = new Date(event.end);
    const formattedTimeend = formatTime(eventEndDate);

    const timeDiff = eventStartDate - selectedDate;

    const card = document.createElement('div');
    card.classList.add('event-card', 'card', 'mb-3', 'shadow-sm', 'bg-light');
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title font-weight-bold">${event.title}</h5> 
            <p class="card-text"><span class="label">Campus:</span> ${event.campus.name || 'N/A'}</p>
            <p class="card-text"><span class="label">Location:</span> ${event.location.name || 'N/A'}</p>
            <p class="card-text"><span class="label">When:</span> ${formattedTimestart} - ${formattedTimeend}</p>
        </div>
    `;

    return { card, timeDiff };
}

// Format time to display only hours and minutes
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
}



// Initialize the page and refresh every 10 minutes
function init() {
    checkForUpdates(); // Fetch the events on initial load
    displayMonthHeader();
    displayWeek();

    // Check for updates every 100 minutes (60,000 milliseconds)
    setInterval(checkForUpdates, 6000000);
}

init();
