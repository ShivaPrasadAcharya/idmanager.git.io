// DOM Elements
const form = document.getElementById('idCardForm');
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const submitBtn = document.getElementById('submitBtn');
const showFormBtn = document.getElementById('showFormBtn');
const hideFormBtn = document.getElementById('hideFormBtn');
const formSection = document.getElementById('formSection');
const dataPreview = document.getElementById('dataPreview');
const copyDataBtn = document.getElementById('copyDataBtn');
const selectedFilters = document.getElementById('selectedFilters');

let cards = [];
let editingId = null;
let activeFilters = new Set();

// Toggle form visibility
showFormBtn.addEventListener('click', () => {
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth' });
});

hideFormBtn.addEventListener('click', () => {
    formSection.style.display = 'none';
});

// Initialize cards
function initializeCards() {
    // Load cards from localStorage
    const storedCards = JSON.parse(localStorage.getItem('idCards')) || [];
    cards = [...defaultCards, ...storedCards];
    updateFilterOptions();
    renderCards();
}

// Update filter options based on available cards
function updateFilterOptions() {
    const filterCategories = new Set();
    cards.forEach(card => {
        if (Array.isArray(card.filterBy)) {
            card.filterBy.forEach(category => filterCategories.add(category));
        } else if (card.filterBy) {
            card.filterBy.split(',').forEach(category => 
                filterCategories.add(category.trim())
            );
        }
    });

    filterSelect.innerHTML = Array.from(filterCategories)
        .sort()
        .map(category => `<option value="${category}">${category}</option>`)
        .join('');
}

// Update selected filters display
function updateSelectedFiltersDisplay() {
    selectedFilters.innerHTML = Array.from(activeFilters)
        .map(filter => `
            <span class="filter-tag">
                ${filter}
                <button onclick="removeFilter('${filter}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
}

// Remove filter
function removeFilter(filter) {
    activeFilters.delete(filter);
    updateSelectedFiltersDisplay();
    renderCards();
}

// Filter select handler
filterSelect.addEventListener('change', (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions)
        .map(option => option.value);
    
    selectedOptions.forEach(option => activeFilters.add(option));
    updateSelectedFiltersDisplay();
    renderCards();
});

// Toggle filter dropdown
function toggleFilterDropdown() {
    const dropdown = document.getElementById('filterDropdown');
    const header = document.querySelector('.filter-header');
    dropdown.classList.toggle('show');
    header.classList.toggle('active');

    // Close dropdown when clicking outside
    if (dropdown.classList.contains('show')) {
        document.addEventListener('click', closeFilterDropdown);
    } else {
        document.removeEventListener('click', closeFilterDropdown);
    }
}

// Close filter dropdown when clicking outside
function closeFilterDropdown(event) {
    const filterContainer = document.querySelector('.filter-container');
    if (!filterContainer.contains(event.target)) {
        const dropdown = document.getElementById('filterDropdown');
        const header = document.querySelector('.filter-header');
        dropdown.classList.remove('show');
        header.classList.remove('active');
        document.removeEventListener('click', closeFilterDropdown);
    }
}

// Initialize the dropdown closure handler
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.filter-header').addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Generate data format preview
function updateDataPreview() {
    const previewData = {
        id: document.getElementById('idNumber').value || '',
        name: document.getElementById('name').value || '',
        address: document.getElementById('address').value || '',
        dob: document.getElementById('dob').value || '',
        fatherName: document.getElementById('fatherName').value || '',
        issuedBy: document.getElementById('issuedBy').value || '',
        issuedOn: document.getElementById('issuedOn').value || '',
        other: document.getElementById('other').value || '',
        filterBy: document.getElementById('filterBy').value.split(',').map(f => f.trim()),
        isLocked: false,
        isPinned: false,
        isFromData: false
    };

    const formattedData = JSON.stringify(previewData, null, 4);
    dataPreview.textContent = formattedData;
}

// Copy data format
copyDataBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(dataPreview.textContent)
        .then(() => {
            copyDataBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyDataBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        });
});

// Update preview on form input
form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateDataPreview);
});

// Render cards
function renderCards() {
    cardsContainer.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();

    // Sort cards (pinned first)
    const sortedCards = [...cards].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // Filter and render cards
    sortedCards.forEach(card => {
        // Check if card matches active filters
        const cardFilters = Array.isArray(card.filterBy) ? 
            card.filterBy : 
            card.filterBy.split(',').map(f => f.trim());
        
        const matchesFilters = activeFilters.size === 0 || 
            cardFilters.some(filter => activeFilters.has(filter));

        // Check if card matches search term
        const cardValues = Object.entries(card)
            .filter(([key]) => key !== 'isLocked' && key !== 'isPinned' && key !== 'isFromData')
            .map(([_, value]) => 
                Array.isArray(value) ? value.join(' ') : value.toString()
            )
            .join(' ')
            .toLowerCase();

        if (matchesFilters && cardValues.includes(searchTerm)) {
            const cardElement = createCardElement(card);
            cardsContainer.appendChild(cardElement);
        }
    });
}

// Create card element
function createCardElement(card) {
    const template = document.getElementById('cardTemplate');
    const cardElement = template.content.cloneNode(true).querySelector('.id-card');
    
    // Set card data with highlighting
    function setHighlightedContent(element, content) {
        if (searchInput.value) {
            element.innerHTML = highlightText(content, searchInput.value);
        } else {
            element.textContent = content;
        }
    }

    setHighlightedContent(cardElement.querySelector('.id-number'), card.id);
    setHighlightedContent(cardElement.querySelector('.name'), card.name);
    setHighlightedContent(cardElement.querySelector('.address'), card.address);
    setHighlightedContent(cardElement.querySelector('.dob'), card.dob);
    setHighlightedContent(cardElement.querySelector('.father-name'), card.fatherName);
    setHighlightedContent(cardElement.querySelector('.issued-by'), card.issuedBy);
    setHighlightedContent(cardElement.querySelector('.issued-on'), card.issuedOn);
    setHighlightedContent(cardElement.querySelector('.other'), card.other || '');
    
    // Handle filter categories display
    const filterCategories = Array.isArray(card.filterBy) ? 
        card.filterBy : 
        card.filterBy.split(',').map(f => f.trim());
    setHighlightedContent(
        cardElement.querySelector('.filter-by'),
        filterCategories.join(', ')
    );

    // Show lock icon only for cards from data.js
    const lockedIcon = cardElement.querySelector('.locked-icon');
    lockedIcon.style.display = card.isFromData ? 'block' : 'none';

    // Setup card controls
    setupCardControls(cardElement, card);

    return cardElement;
}

// Highlight search text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.toString().replace(regex, '<span class="highlight">$1</span>');
}

// Setup card controls
function setupCardControls(cardElement, card) {
    const flipBtn = cardElement.querySelector('.flip-btn');
    const editBtn = cardElement.querySelector('.edit-btn');
    const deleteBtn = cardElement.querySelector('.delete-btn');
    const pinBtn = cardElement.querySelector('.pin-btn');

    // Flip functionality
    flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cardElement.classList.toggle('flipped');
    });

    // Hide edit/delete/pin buttons for locked cards
    if (card.isFromData) {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        pinBtn.style.display = 'none';
    } else {
        // Edit functionality
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editCard(card);
        });

        // Delete functionality
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCard(card.id);
        });

        // Pin functionality
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePin(card.id);
        });
    }
}

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('idNumber').value || generateId(),
        name: document.getElementById('name').value || '',
        address: document.getElementById('address').value || '',
        dob: document.getElementById('dob').value || '',
        fatherName: document.getElementById('fatherName').value || '',
        issuedBy: document.getElementById('issuedBy').value || '',
        issuedOn: document.getElementById('issuedOn').value || '',
        other: document.getElementById('other').value || '',
        filterBy: document.getElementById('filterBy').value.split(',').map(f => f.trim()),
        isLocked: false,
        isPinned: false,
        isFromData: false
    };

    if (editingId) {
        // Update existing card
        cards = cards.map(card => 
            card.id === editingId ? { ...card, ...formData } : card
        );
        editingId = null;
        submitBtn.textContent = 'Create Card';
    } else {
        // Add new card
        cards.push(formData);
    }

    // Save and update display
    saveToLocalStorage();
    updateFilterOptions();
    renderCards();
    form.reset();
    dataPreview.textContent = '';
    formSection.style.display = 'none';
});

// Generate unique ID
function generateId() {
    return 'ID' + Date.now().toString().slice(-6);
}

// Edit card
function editCard(card) {
    editingId = card.id;
    document.getElementById('idNumber').value = card.id;
    document.getElementById('name').value = card.name;
    document.getElementById('address').value = card.address;
    document.getElementById('dob').value = card.dob;
    document.getElementById('fatherName').value = card.fatherName;
    document.getElementById('issuedBy').value = card.issuedBy;
    document.getElementById('issuedOn').value = card.issuedOn;
    document.getElementById('other').value = card.other;
    document.getElementById('filterBy').value = Array.isArray(card.filterBy) ? 
        card.filterBy.join(', ') : 
        card.filterBy;
    
    submitBtn.textContent = 'Update Card';
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth' });
    updateDataPreview();
}

// Delete card
function deleteCard(id) {
    if (confirm('Are you sure you want to delete this card?')) {
        cards = cards.filter(card => card.id !== id);
        saveToLocalStorage();
        updateFilterOptions();
        renderCards();
    }
}

// Toggle pin status
function togglePin(id) {
    cards = cards.map(card =>
        card.id === id ? { ...card, isPinned: !card.isPinned } : card
    );
    saveToLocalStorage();
    renderCards();
}

// Save non-locked cards to localStorage
function saveToLocalStorage() {
    const cardsToStore = cards.filter(card => !card.isFromData);
    localStorage.setItem('idCards', JSON.stringify(cardsToStore));
}

// Search input handler
searchInput.addEventListener('input', renderCards);

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeCards);