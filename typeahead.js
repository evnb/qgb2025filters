// Simple typeahead functionality for the filter input
// Uses a wordlist file for suggestions

class SimpleTypeahead {
  constructor(inputElement) {
    this.input = inputElement;
    this.suggestions = [];
    this.filteredSuggestions = [];
    this.dropdown = null;
    this.selectedIndex = -1;
    this.isVisible = false;
    
    this.init();
  }

  async init() {
    // Load wordlist
    await this.loadWordlist();
    
    // Create dropdown
    this.createDropdown();
    
    // Add event listeners
    this.addEventListeners();
    
    console.log('SimpleTypeahead initialized with', this.suggestions.length, 'suggestions');
  }

  async loadWordlist() {
    try {
      const response = await fetch('wordlist.json');
      this.suggestions = await response.json();
      console.log('Loaded wordlist:', this.suggestions);
    } catch (error) {
      console.error('Error loading wordlist:', error);
      // Fallback to basic suggestions
      this.suggestions = ['AND', 'OR', 'NOT', '(', ')', 'puzzle', 'action', 'adventure'];
    }
  }

  createDropdown() {
    // Make sure the input container has relative positioning
    if (this.input.parentNode.style.position !== 'relative') {
      this.input.parentNode.style.position = 'relative';
    }
    
    // Create dropdown container
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'typeahead-dropdown';
    this.dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      margin-top: 2px;
    `;

    // Insert dropdown after input
    this.input.parentNode.insertBefore(this.dropdown, this.input.nextSibling);
    
    // Add styles
    this.addStyles();
    
    console.log('Dropdown created and positioned');
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .typeahead-dropdown {
        font-family: inherit;
        font-size: inherit;
      }
      
      .typeahead-dropdown .suggestion-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.1s;
      }
      
      .typeahead-dropdown .suggestion-item:hover,
      .typeahead-dropdown .suggestion-item.selected {
        background-color: #f0f8ff;
      }
      
      .typeahead-dropdown .suggestion-item:last-child {
        border-bottom: none;
      }
      
      .typeahead-dropdown .highlight {
        background-color: #ffeb3b;
        font-weight: bold;
        padding: 0 2px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  addEventListeners() {
    // Input event
    this.input.addEventListener('input', (e) => this.handleInput(e));
    
    // Keydown events
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Focus/blur events
    this.input.addEventListener('focus', () => this.handleFocus());
    this.input.addEventListener('blur', () => this.handleBlur());
    
    // Click outside to hide
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  handleInput(event) {
    const value = this.input.value;
    console.log('Input event, value:', value);
    
    if (!value || value.trim() === '') {
      this.hideDropdown();
      return;
    }

    // Get the last word being typed
    const lastWord = this.getLastWord(value);
    console.log('Last word:', lastWord);
    
    if (lastWord && lastWord.length > 0) {
      this.filterSuggestions(lastWord);
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }

  getLastWord(inputValue) {
    // Get cursor position
    const cursorPos = this.input.selectionStart || inputValue.length;
    
    // Get text before cursor
    const beforeCursor = inputValue.substring(0, cursorPos);
    
    // Split into words and get the last one
    const words = beforeCursor.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || '';
    
    console.log(`getLastWord: input="${inputValue}", cursorPos=${cursorPos}, beforeCursor="${beforeCursor}", words=[${words}], lastWord="${lastWord}"`);
    
    return lastWord;
  }

  filterSuggestions(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    this.filteredSuggestions = this.suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(term)
    );
    
    console.log(`Filtered suggestions for "${searchTerm}":`, this.filteredSuggestions);
    
    // Limit to 10 suggestions
    this.filteredSuggestions = this.filteredSuggestions.slice(0, 10);
  }

  showDropdown() {
    if (this.filteredSuggestions.length === 0) {
      this.hideDropdown();
      return;
    }

    this.renderDropdown();
    this.dropdown.style.display = 'block';
    this.isVisible = true;
    this.selectedIndex = -1;
    
    console.log('Dropdown shown with', this.filteredSuggestions.length, 'suggestions');
  }

  hideDropdown() {
    this.dropdown.style.display = 'none';
    this.isVisible = false;
    this.selectedIndex = -1;
    console.log('Dropdown hidden');
  }

  renderDropdown() {
    const searchTerm = this.getLastWord(this.input.value);
    
    this.dropdown.innerHTML = this.filteredSuggestions.map((suggestion, index) => {
      const highlighted = this.highlightMatch(suggestion, searchTerm);
      return `<div class="suggestion-item" data-index="${index}">${highlighted}</div>`;
    }).join('');

    // Add click handlers
    this.dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectSuggestion(this.filteredSuggestions[parseInt(item.dataset.index)]);
      });
    });
  }

  highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  selectSuggestion(suggestion) {
    const currentValue = this.input.value;
    const lastWord = this.getLastWord(currentValue);
    
    if (lastWord) {
      // Replace the last word with the suggestion
      const beforeLastWord = currentValue.substring(0, currentValue.lastIndexOf(lastWord));
      const afterLastWord = currentValue.substring(currentValue.lastIndexOf(lastWord) + lastWord.length);
      
      this.input.value = beforeLastWord + suggestion + afterLastWord;
      
      // Set cursor position after the suggestion
      const newCursorPos = beforeLastWord.length + suggestion.length;
      this.input.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      // No last word, just set the value
      this.input.value = suggestion;
    }
    
    // Hide dropdown
    this.hideDropdown();
    
    // Focus back to input
    this.input.focus();
    
    console.log('Selected suggestion:', suggestion);
  }

  handleKeydown(event) {
    if (!this.isVisible) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredSuggestions.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.filteredSuggestions[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        this.hideDropdown();
        break;
        
      case 'Tab':
        if (this.selectedIndex >= 0) {
          event.preventDefault();
          this.selectSuggestion(this.filteredSuggestions[this.selectedIndex]);
        }
        break;
    }
  }

  updateSelection() {
    // Remove previous selection
    this.dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Add selection to current item
    if (this.selectedIndex >= 0) {
      const selectedItem = this.dropdown.querySelector(`[data-index="${this.selectedIndex}"]`);
      if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  handleFocus() {
    const value = this.input.value;
    if (value && value.trim() !== '') {
      const lastWord = this.getLastWord(value);
      if (lastWord && lastWord.length > 0) {
        this.filterSuggestions(lastWord);
        this.showDropdown();
      }
    }
  }

  handleBlur() {
    // Small delay to allow for clicks on suggestions
    setTimeout(() => {
      if (!this.dropdown.contains(document.activeElement)) {
        this.hideDropdown();
      }
    }, 150);
  }

  // Test method
  test() {
    console.log('Testing typeahead...');
    console.log('Input value:', this.input.value);
    console.log('Suggestions loaded:', this.suggestions.length);
    console.log('Dropdown element:', this.dropdown);
    console.log('Is visible:', this.isVisible);
    
    // Test with a sample word
    this.input.value = 'test';
    this.input.focus();
    this.handleInput({ target: this.input });
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  
  const filterInput = document.getElementById('filterInput');
  if (filterInput) {
    console.log('Filter input found, creating SimpleTypeahead');
    window.simpleTypeahead = new SimpleTypeahead(filterInput);
  } else {
    console.log('Filter input not found!');
  }
});
