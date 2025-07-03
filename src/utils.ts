function getRandomEmoji(): string {
  // Common Unicode ranges for emojis
  const emojiRanges = [
    [0x1f680, 0x1f686], // Rockets and transport (🚀 to 🚆)
    [0x1f436, 0x1f437], // Dog and pig face (🐶 to 🐷)
    [0x1f331, 0x1f334], // Plant and tree (🌱 to 🌴)
    [0x1f355, 0x1f357], // Food (🍕 to 🍗)
    [0x1f381, 0x1f382], // Gift and cake (🎁 to 🎂)
    [0x1f4a9, 0x1f4aa], // Pile of poo and flexed biceps (💩 to 💪)
  ];

  // Select a random range
  const randomRange =
    emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
  const [start, end] = randomRange;

  // Generate a random code point within the selected range
  const randomCodePoint = Math.floor(Math.random() * (end - start + 1)) + start;

  // Convert the code point to a character (emoji)
  return String.fromCodePoint(randomCodePoint);
}

function generateRandomEmojis(count: number): string {
  let emojis: string = "";
  for (let i = 0; i < count; i++) {
    emojis += getRandomEmoji();
  }
  return emojis;
}

export { generateRandomEmojis };
