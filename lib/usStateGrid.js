// A stylized tile-grid layout of the US (all 50 states + DC), not a
// literal geographic map - each state gets one cell, positioned so the
// grid still reads left-to-right as west-to-east and top-to-bottom as
// north-to-south. Used for the interactive state licensing map.
export const US_STATE_GRID = [
  { abbr: "WA", name: "Washington", row: 0, col: 1 },
  { abbr: "MT", name: "Montana", row: 0, col: 3 },
  { abbr: "ND", name: "North Dakota", row: 0, col: 4 },
  { abbr: "MN", name: "Minnesota", row: 0, col: 5 },
  { abbr: "WI", name: "Wisconsin", row: 0, col: 6 },
  { abbr: "MI", name: "Michigan", row: 0, col: 7 },
  { abbr: "NY", name: "New York", row: 0, col: 10 },
  { abbr: "ME", name: "Maine", row: 0, col: 11 },

  { abbr: "OR", name: "Oregon", row: 1, col: 1 },
  { abbr: "ID", name: "Idaho", row: 1, col: 2 },
  { abbr: "WY", name: "Wyoming", row: 1, col: 3 },
  { abbr: "SD", name: "South Dakota", row: 1, col: 4 },
  { abbr: "IA", name: "Iowa", row: 1, col: 5 },
  { abbr: "IL", name: "Illinois", row: 1, col: 6 },
  { abbr: "IN", name: "Indiana", row: 1, col: 7 },
  { abbr: "OH", name: "Ohio", row: 1, col: 8 },
  { abbr: "PA", name: "Pennsylvania", row: 1, col: 9 },
  { abbr: "VT", name: "Vermont", row: 1, col: 10 },
  { abbr: "NH", name: "New Hampshire", row: 1, col: 11 },

  { abbr: "CA", name: "California", row: 2, col: 0 },
  { abbr: "NV", name: "Nevada", row: 2, col: 1 },
  { abbr: "UT", name: "Utah", row: 2, col: 2 },
  { abbr: "CO", name: "Colorado", row: 2, col: 3 },
  { abbr: "NE", name: "Nebraska", row: 2, col: 4 },
  { abbr: "MO", name: "Missouri", row: 2, col: 5 },
  { abbr: "KY", name: "Kentucky", row: 2, col: 6 },
  { abbr: "WV", name: "West Virginia", row: 2, col: 7 },
  { abbr: "VA", name: "Virginia", row: 2, col: 8 },
  { abbr: "MD", name: "Maryland", row: 2, col: 9 },
  { abbr: "NJ", name: "New Jersey", row: 2, col: 10 },
  { abbr: "MA", name: "Massachusetts", row: 2, col: 11 },

  { abbr: "AZ", name: "Arizona", row: 3, col: 1 },
  { abbr: "NM", name: "New Mexico", row: 3, col: 3 },
  { abbr: "KS", name: "Kansas", row: 3, col: 4 },
  { abbr: "AR", name: "Arkansas", row: 3, col: 5 },
  { abbr: "TN", name: "Tennessee", row: 3, col: 6 },
  { abbr: "NC", name: "North Carolina", row: 3, col: 7 },
  { abbr: "DC", name: "Washington DC", row: 3, col: 8 },
  { abbr: "DE", name: "Delaware", row: 3, col: 9 },
  { abbr: "CT", name: "Connecticut", row: 3, col: 10 },
  { abbr: "RI", name: "Rhode Island", row: 3, col: 11 },

  { abbr: "OK", name: "Oklahoma", row: 4, col: 4 },
  { abbr: "LA", name: "Louisiana", row: 4, col: 5 },
  { abbr: "MS", name: "Mississippi", row: 4, col: 6 },
  { abbr: "AL", name: "Alabama", row: 4, col: 7 },
  { abbr: "GA", name: "Georgia", row: 4, col: 8 },
  { abbr: "SC", name: "South Carolina", row: 4, col: 9 },

  { abbr: "TX", name: "Texas", row: 5, col: 4 },
  { abbr: "FL", name: "Florida", row: 5, col: 8 },

  { abbr: "AK", name: "Alaska", row: 7, col: 0 },
  { abbr: "HI", name: "Hawaii", row: 7, col: 1 },
];
