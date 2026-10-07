/**
 * Capitalizes the 1st letter of each word in a string,
 * leaving the rest of the characters unchanged.
 *
 * Example:
 *  "cult fit" -> "Cult Fit"
 *  "gold's gym" -> "Gold's Gym"
 *  "FITNESS PRO" -> "FITNESS PRO"
 *  "cross-fit studio" -> "Cross-Fit Studio"
 */
export const formatGymName = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.replace(/(^|[\s(\[-])([a-zA-Z])/g, (_, boundary, letter) => boundary + letter.toUpperCase());
};

export const capitalizeWords = formatGymName;

export default formatGymName;
