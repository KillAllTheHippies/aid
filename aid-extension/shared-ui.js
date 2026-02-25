/**
 * AID – Shared UI Logic
 * Handles interactive filter inputs, autocomplete dropdowns, and category chips.
 * This logic is shared between the popup and the side panel.
 */

function initFilterUI({
    inputEl,
    dropdownEl,
    chipsContainerEl,
    categoryChips, // Array or NodeList of DOM elements
    fuzzyToggleEl = null, // Optional
    initialFilters = [],
    onFilterChange = () => { }
}) {
    let charFilters = [...initialFilters];
    const categoryStates = {};
    let knownChars = [];
    try { knownChars = getAllKnownCharacters(); } catch { /* Ignore if unicode-chars not loaded */ }

    // Initialize category toggles (the inclusion/exclusion group toggles)
    categoryChips.forEach(chip => {
        const cat = chip.dataset.category;
        categoryStates[cat] = chip.dataset.state;

        chip.addEventListener('click', () => {
            const newState = chip.dataset.state === 'include' ? 'exclude' : 'include';
            chip.dataset.state = newState;
            categoryStates[cat] = newState;
            chip.querySelector('.sf-toggle').textContent = newState === 'include' ? '+' : '\u2212';
            triggerDropdownRefresh();
        });
    });

    function getFilteredKnownChars(query) {
        const enabledCategories = Object.entries(categoryStates)
            .filter(([, state]) => state === 'include')
            .map(([cat]) => cat);

        return knownChars.filter(c => {
            if (!enabledCategories.includes(c.searchCategory)) return false;
            if (query) {
                if (fuzzyToggleEl && fuzzyToggleEl.checked) {
                    const chunks = query.toLowerCase().split(/\s+/).filter(Boolean);
                    if (chunks.length === 0) return true;
                    return chunks.every(chunk => c.name.toLowerCase().includes(chunk) || c.codeStr.toLowerCase().includes(chunk));
                } else {
                    return c.name.toLowerCase().includes(query) ||
                        c.codeStr.toLowerCase().includes(query);
                }
            }
            return true;
        }).slice(0, 500); // hard limit to prevent UI stutter
    }

    function triggerDropdownRefresh() {
        if (!dropdownEl.classList.contains('show')) return;
        const query = inputEl.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    }

    function renderFilterChips() {
        chipsContainerEl.innerHTML = '';
        charFilters.forEach((filter, index) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.dataset.type = filter.type;

            const toggle = document.createElement('div');
            toggle.className = 'filter-chip-toggle';
            toggle.dataset.type = filter.type;
            toggle.textContent = filter.type === 'include' ? '+' : (filter.type === 'exclude' ? '−' : '×');
            toggle.title = filter.type === 'include' ? 'Include (Allow-list)' : (filter.type === 'exclude' ? 'Exclude (Ignore)' : 'Disabled');
            toggle.addEventListener('click', () => {
                if (filter.type === 'exclude') filter.type = 'disabled';
                else if (filter.type === 'disabled') filter.type = 'include';
                else filter.type = 'exclude';
                renderFilterChips();
                // We pass back the new array to completely replace settings
                onFilterChange([...charFilters]);
            });

            const label = document.createElement('div');
            label.className = 'filter-chip-label';
            label.textContent = filter.id;

            const remove = document.createElement('div');
            remove.className = 'filter-chip-remove';
            remove.textContent = '×';
            remove.addEventListener('click', () => {
                charFilters.splice(index, 1);
                renderFilterChips();
                onFilterChange([...charFilters]);
            });

            chip.appendChild(toggle);
            chip.appendChild(label);
            chip.appendChild(remove);
            chipsContainerEl.appendChild(chip);
        });
    }

    let currentFocus = -1;
    let currentMatches = [];

    function renderDropdown(matches) {
        currentMatches = matches;
        currentFocus = -1;
        dropdownEl.innerHTML = '';
        if (matches.length === 0) {
            dropdownEl.classList.remove('show');
            return;
        }

        matches.forEach((match) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';

            const codeSpan = document.createElement('span');
            codeSpan.className = 'dropdown-item-code';
            codeSpan.textContent = match.codeStr;

            item.appendChild(codeSpan);
            item.appendChild(document.createTextNode(match.name));

            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                addFilter(match);
            });

            dropdownEl.appendChild(item);
        });
        dropdownEl.classList.add('show');
    }

    function addFilter(match) {
        if (!charFilters.find(f => f.id === match.codeStr)) {
            charFilters.push({ id: match.codeStr, type: 'exclude' });
            renderFilterChips();
            onFilterChange([...charFilters]);
        }
        inputEl.value = '';
        dropdownEl.classList.remove('show');
        inputEl.focus();
    }

    function setActiveItem(items) {
        if (!items || items.length === 0) return;
        Array.from(items).forEach(item => item.classList.remove('active'));
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('active');
        items[currentFocus].scrollIntoView({ block: 'nearest' });
    }

    inputEl.addEventListener('keydown', (e) => {
        const items = dropdownEl.querySelectorAll('.dropdown-item');
        if (!dropdownEl.classList.contains('show') || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            currentFocus++;
            setActiveItem(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            setActiveItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                items[currentFocus].dispatchEvent(new MouseEvent('mousedown'));
            } else if (items.length === 1) {
                items[0].dispatchEvent(new MouseEvent('mousedown'));
            }
        }
    });

    inputEl.addEventListener('input', () => {
        const query = inputEl.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    inputEl.addEventListener('focus', () => {
        const query = inputEl.value.trim().toLowerCase();
        renderDropdown(getFilteredKnownChars(query));
    });

    inputEl.addEventListener('click', () => {
        if (!dropdownEl.classList.contains('show')) {
            const query = inputEl.value.trim().toLowerCase();
            renderDropdown(getFilteredKnownChars(query));
        }
    });

    inputEl.addEventListener('blur', () => {
        dropdownEl.classList.remove('show');
    });

    if (fuzzyToggleEl) {
        fuzzyToggleEl.addEventListener('change', () => {
            triggerDropdownRefresh();
            // Keep focus on input so they can keep typing
            inputEl.focus();
        });
    }

    // Render chips if there's any initial ones provided synchronously
    renderFilterChips();

    // Expose a public API to allow replacing filters async 
    // (like when `chrome.storage` resolves)
    return {
        updateFilters: (newFilters) => {
            charFilters = [...newFilters];
            renderFilterChips();
        }
    };
}
