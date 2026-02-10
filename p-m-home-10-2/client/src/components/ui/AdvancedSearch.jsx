import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Clock, TrendingUp, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './Input.jsx';
import { Button } from './Button.jsx';
import { Badge } from './Badge.jsx';

/**
 * Advanced search component with filters, suggestions, and smart features
 */
export function AdvancedSearch({
  placeholder = "Search...",
  value = '',
  onChange,
  filters = [],
  onFiltersChange,
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  onSuggestionClick,
  onRecentSearchClick,
  debounceMs = 300,
  showFilters = true,
  className = '',
  size = 'default'
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const searchRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
      onChange?.(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion);
    setDebouncedValue(suggestion);
    onChange?.(suggestion);
    onSuggestionClick?.(suggestion);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (search) => {
    setLocalValue(search);
    setDebouncedValue(search);
    onChange?.(search);
    onRecentSearchClick?.(search);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setLocalValue('');
    setDebouncedValue('');
    onChange?.('');
    setShowSuggestions(false);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!localValue.trim()) return suggestions;
    return suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(localValue.toLowerCase())
    );
  }, [suggestions, localValue]);

  const hasActiveFilters = filters.some(filter => filter.active);
  const activeFilterCount = filters.filter(filter => filter.active).length;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="search"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          leftIcon={<Search className="w-4 h-4" />}
          className="pr-20"
          aria-label="Search"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {localValue && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {showFilters && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`p-1 transition-colors ${
                hasActiveFilters
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Toggle filters"
              aria-expanded={showSuggestions}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {(showSuggestions && (isFocused || localValue)) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden"
            role="listbox"
            aria-label="Search suggestions"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && !localValue && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    role="option"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && !localValue && (
              <div className="p-2 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" />
                  Popular Searches
                </div>
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    role="option"
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Search className="w-3 h-3" />
                  Suggestions
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                    role="option"
                  >
                    <span className="text-sm text-gray-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Filters Panel */}
            {showFilters && filters.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Filter className="w-3 h-3" />
                  Filters
                </div>
                <div className="px-3 py-2 space-y-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`filter-${index}`}
                        checked={filter.active}
                        onChange={(e) => {
                          const newFilters = [...filters];
                          newFilters[index] = { ...filter, active: e.target.checked };
                          onFiltersChange?.(newFilters);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`filter-${index}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {filter.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Filter chips component for displaying active filters
 */
export function FilterChips({ filters = [], onRemove, className = '' }) {
  if (filters.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
            filter.variant === 'primary'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : filter.variant === 'secondary'
              ? 'bg-gray-100 text-gray-800 border-gray-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
        >
          {filter.icon && <filter.icon className="w-3 h-3" />}
          <span>{filter.label}</span>
          {filter.value && <span className="text-gray-600">: {filter.value}</span>}
          {onRemove && (
            <button
              onClick={() => onRemove(filter)}
              className="ml-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Quick filter presets for common search scenarios
 */
export function QuickFilters({ presets = [], onSelectPreset, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-600 mr-2 self-center">Quick filters:</span>
      {presets.map((preset, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelectPreset?.(preset)}
          className="text-xs"
        >
          {preset.icon && <preset.icon className="w-3 h-3 mr-1" />}
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Search command palette (like VS Code command palette)
 */
export function SearchCommandPalette({
  isOpen,
  onClose,
  commands = [],
  onCommandSelect,
  placeholder = "Type a command or search..."
}) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!searchValue.trim()) return commands;
    return commands.filter(command =>
      command.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [commands, searchValue]);

  useEffect(() => {
    if (!isOpen) {
      setSearchValue('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onCommandSelect?.(filteredCommands[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onCommandSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  onCommandSelect?.(command);
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {command.icon && <command.icon className="w-5 h-5 text-gray-500" />}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{command.title}</div>
                  {command.description && (
                    <div className="text-sm text-gray-500">{command.description}</div>
                  )}
                </div>
                {command.shortcut && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {command.shortcut}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}