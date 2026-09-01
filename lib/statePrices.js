// Price to acquire a license/appointment in each state you're not yet
// licensed in. null shows as "Price not set" on hover instead of a
// dollar amount.
export const STATE_PRICES = {
  // Eastern Time Zone
  OH: 10, MI: 10, VA: 15, SC: 25, FL: 50, WV: 50, MD: 54, ME: 55,
  NY: 72, NC: 94, DE: 100, DC: 100, KY: 100, PA: 110, GA: 120, RI: 130,
  CT: 140, NJ: 170, IN: 188, NH: 210, VT: 218, MA: 225,

  // Central Time Zone
  SD: 30, IA: 50, NE: 50, TX: 50, KS: 50, MN: 60, AR: 70, LA: 75,
  WI: 75, AL: 80, MO: 100, ND: 100, MS: 101, OK: 120, TN: 144, IL: 380,

  // Mountain Time Zone
  NM: 30, CO: 71, UT: 75, ID: 80, MT: 100, AZ: 120, WY: 150,

  // Pacific Time Zone
  WA: 55, OR: 75, NV: 185, CA: 188,

  // Alaska Time Zone
  AK: 75,

  // Hawaii-Aleutian Time Zone
  HI: 225,
};
